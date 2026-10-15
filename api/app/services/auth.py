# app/services/auth.py
# 鉴权安全工具：访问令牌（HS256 JWT）+ 用户登录态校验。
#
# [融合] JWT 签发/校验算法已与 sakura_base.auth.jwt 对齐（HS256，标准 3 段紧凑 JWT）。
#   - 优先复用共享底座；底座未安装时回退到“与底座逐字节等价”的内嵌实现，
#     保证：① 新令牌与底座完全互通；② 安装底座后旧令牌仍可被底座验证；
#     ③ 底座未装也不影响现有运行环境（不强制改环境）。
#   - parse_access_token 采用双格式解析：先按标准 3 段 JWT 解析（新令牌），
#     失败再回退到切换前签发的 2 段遗留令牌，保证“旧令牌可验、在线会话不失效”。
# 密码哈希保留在 app.services.users（pbkdf2_sha256$base64$base64，12 万迭代），不触碰已落库哈希。
#
# 最终收敛路径：在电商环境执行
#   pip install -e <sakura_platform>/packages/sakura_base[web]
# 后，本模块会自动改用底座实现（_HAS_BASE_JWT=True），无需再改任何业务代码。

import base64
import hashlib
import hmac
import json
import time
from datetime import UTC, datetime
from typing import Any

from app.core.config import Settings, get_settings
from app.models import User, UserStatus


class AuthTokenError(ValueError):
    pass


# --------------------------------------------------------------------------- #
# [融合] 统一 JWT 实现（与 sakura_base.auth.jwt 互通）
# --------------------------------------------------------------------------- #
try:
    from sakura_base.auth import jwt as base_jwt

    _HAS_BASE_JWT = True
except ImportError:  # 底座未安装时退化为内嵌等价实现，避免破坏现有环境
    base_jwt = None
    _HAS_BASE_JWT = False


def _b64url(b: bytes) -> str:
    """Base64URL（去填充），统一主流程中的编码格式。"""
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")


def _b64url_decode(s: str) -> bytes:
    """Base64URL 解码（补回填充）。"""
    pad = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + pad)


def _encode_jwt(payload: dict[str, Any], secret: str, *, expires_in: int) -> str:
    """签发 HS256 JWT（3 段）。底座可用时直接转交，否则用逐字节等价的内嵌实现。"""
    if _HAS_BASE_JWT:
        return base_jwt.encode_jwt(payload, secret, expires_in=expires_in)
    # 内嵌实现（与 sakura_base.auth.jwt.encode_jwt 逐字节等价）
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    body = dict(payload)
    body["iat"] = now
    body["exp"] = now + expires_in
    seg1 = _b64url(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    seg2 = _b64url(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    signing_input = f"{seg1}.{seg2}".encode("ascii")
    sig = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    return f"{seg1}.{seg2}.{_b64url(sig)}"


def _decode_jwt(token: str, secret: str, *, verify_exp: bool = True) -> dict[str, Any] | None:
    """校验并（可选）校验过期；成功返回 payload，失败返回 None。"""
    if _HAS_BASE_JWT:
        return base_jwt.decode_jwt(token, secret, verify_exp=verify_exp)
    # 内嵌实现（与 sakura_base.auth.jwt.decode_jwt 逐字节等价）
    try:
        seg1, seg2, sig_b64 = token.split(".")
    except ValueError:
        return None
    signing_input = f"{seg1}.{seg2}".encode("ascii")
    expected = hmac.new(secret.encode("utf-8"), signing_input, hashlib.sha256).digest()
    if not hmac.compare_digest(_b64url(expected), sig_b64):
        return None
    try:
        payload = json.loads(_b64url_decode(seg2))
    except Exception:
        return None
    if verify_exp and isinstance(payload.get("exp"), int) and payload["exp"] < int(time.time()):
        return None
    return payload


# --------------------------------------------------------------------------- #
# 遗留 2 段令牌兼容（切换前格式：payload.signature，无 header 段）
# --------------------------------------------------------------------------- #
def _sign(encoded_payload: str, secret_key: str) -> str:
    """遗留令牌签名：HMAC-SHA256(payload)，仅用于验证切换前签发的 2 段令牌。"""
    digest = hmac.new(secret_key.encode("utf-8"), encoded_payload.encode("utf-8"), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).decode("ascii").rstrip("=")


def _base64url_encode(value: bytes) -> str:
    """遗留令牌载荷编码。"""
    return base64.urlsafe_b64encode(value).decode("ascii").rstrip("=")


def _base64url_decode(value: str) -> bytes:
    """遗留令牌载荷解码。"""
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


# --------------------------------------------------------------------------- #
# 对外接口
# --------------------------------------------------------------------------- #
def create_access_token(user: User, settings: Settings | None = None) -> str:
    """为指定用户签发标准 HS256 JWT（3 段）；载荷含 sub / email / role / iat / exp。"""
    settings = settings or get_settings()
    expires_in = settings.auth_token_expire_minutes * 60
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
    }
    # [融合] 统一走与底座互通的 HS256 实现（底座优先，否则内嵌等价实现）
    return _encode_jwt(payload, settings.auth_secret_key, expires_in=expires_in)


def parse_access_token(token: str, settings: Settings | None = None) -> dict[str, Any]:
    """解析访问令牌（双格式）：优先标准 3 段 JWT，回退遗留 2 段令牌。"""
    settings = settings or get_settings()
    # 标准 3 段 JWT（新令牌）：与底座互通
    if token.count(".") == 2:
        payload = _decode_jwt(token, settings.auth_secret_key, verify_exp=True)
        if payload is None:
            raise AuthTokenError("Token is invalid or expired")
        return payload
    # 遗留 2 段令牌（切换前签发）：payload.signature，无 header 段
    try:
        encoded_payload, signature = token.split(".", 1)
    except ValueError as exc:
        raise AuthTokenError("Token format is invalid") from exc

    # 先校验签名再解析载荷，避免未受信任的客户端内容影响后续鉴权分支。
    expected_signature = _sign(encoded_payload, settings.auth_secret_key)
    if not hmac.compare_digest(signature, expected_signature):
        raise AuthTokenError("Token signature is invalid")

    try:
        payload = json.loads(_base64url_decode(encoded_payload))
    except (ValueError, json.JSONDecodeError) as exc:
        raise AuthTokenError("Token payload is invalid") from exc

    expires_at = int(payload.get("exp", 0))
    if expires_at < int(datetime.now(UTC).timestamp()):
        raise AuthTokenError("Token has expired")
    return payload


def ensure_user_can_login(user: User | None) -> User:
    # 登录态每次都回表校验用户状态，便于后台停用账号后立即阻断继续操作。
    """确保用户可登录；集中执行业务校验、状态变更与持久化，并返回可验证结果。"""
    if user is None:
        raise AuthTokenError("User not found")
    if user.status != UserStatus.ACTIVE:
        raise AuthTokenError("User is disabled")
    return user
