# selftest_jwt_convergence.py
# 电商 P3 JWT 收敛自测：
#   1) 新 3 段 JWT 可签发并被 parse_access_token 解析（sub/email/role 完整）
#   2) 切换前签发的 2 段遗留令牌仍可被解析（旧令牌可验、会话不失效）
#   3) 篡改签名 / 过期令牌一律拒绝
#   4) 内嵌实现与真实 sakura_base.auth.jwt 逐字节互通（证明真正收敛）
#
# 运行：从 api/ 目录用项目 venv 执行
#   .venv/Scripts/python.exe selftest_jwt_convergence.py

import base64
import hashlib
import hmac
import json
import os
import sys
import time
from types import SimpleNamespace

# 让 import app.* 可用
API_DIR = os.path.dirname(os.path.abspath(__file__))
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

# 让 import sakura_base 可用（指向共享底座源码目录）
_SAKURA_PKG = r"D:/WorkBuddy/2026-10-14-11-06-38/sakura_platform/packages/sakura_base"
if _SAKURA_PKG not in sys.path:
    sys.path.insert(0, _SAKURA_PKG)

import app.services.auth as auth  # noqa: E402
from sakura_base.auth import jwt as base_jwt  # noqa: E402

SECRET = "dev-auth-secret-change-me"
EXPIRE_MIN = 60 * 24 * 7  # 与电商默认一致


def _fake_settings():
    return SimpleNamespace(auth_secret_key=SECRET, auth_token_expire_minutes=EXPIRE_MIN)


def _fake_user(uid=1, email="u@example.com", role="operator"):
    # 仅用到 id / email / role 三个属性，用轻量对象避免触及数据库
    return SimpleNamespace(id=uid, email=email, role=role)


def _legacy_token(payload: dict, secret: str) -> str:
    """复刻切换前 2 段令牌格式：payload.signature（无 header 段）。"""
    ep = base64.urlsafe_b64encode(json.dumps(payload, separators=(",", ":")).encode()).decode().rstrip("=")
    sig = base64.urlsafe_b64encode(
        hmac.new(secret.encode(), ep.encode(), hashlib.sha256).digest()
    ).decode().rstrip("=")
    return f"{ep}.{sig}"


def _check(name: str, ok: bool):
    print(f"[{'PASS' if ok else 'FAIL'}] {name}")
    if not ok:
        sys.exit(1)


def main():
    settings = _fake_settings()
    user = _fake_user()

    # 1) 新 3 段 JWT 签发 + 解析
    token = auth.create_access_token(user, settings)
    _check("新令牌为 3 段标准 JWT", token.count(".") == 2)
    payload = auth.parse_access_token(token, settings)
    _check("解析得到 sub", payload.get("sub") == "1")
    _check("解析得到 email", payload.get("email") == "u@example.com")
    _check("解析得到 role", payload.get("role") == "operator")
    _check("解析得到 exp", isinstance(payload.get("exp"), int))

    # 2) 遗留 2 段令牌仍可验（核心：旧令牌可验）
    legacy_payload = {"sub": "2", "email": "old@example.com", "role": "owner",
                      "exp": int(time.time()) + 3600}
    legacy_tok = _legacy_token(legacy_payload, SECRET)
    lp = auth.parse_access_token(legacy_tok, settings)
    _check("遗留 2 段令牌 sub 可验", lp.get("sub") == "2")
    _check("遗留 2 段令牌 role 可验", lp.get("role") == "owner")

    # 3) 篡改 / 过期拒绝
    tampered = token[:-4] + ("AAAA" if token[-4:] != "AAAA" else "BBBB")
    try:
        auth.parse_access_token(tampered, settings)
        _check("篡改令牌被拒", False)
    except auth.AuthTokenError:
        _check("篡改令牌被拒", True)

    expired_legacy = _legacy_token(
        {"sub": "3", "email": "e@example.com", "role": "operator", "exp": int(time.time()) - 10},
        SECRET,
    )
    try:
        auth.parse_access_token(expired_legacy, settings)
        _check("过期令牌被拒", False)
    except auth.AuthTokenError:
        _check("过期令牌被拒", True)

    # 4) 内嵌实现与真实底座逐字节互通
    # 4a) 底座能验电商签发的新令牌
    b_payload = base_jwt.decode_jwt(token, SECRET, verify_exp=True)
    _check("底座可验电商新令牌 sub", b_payload is not None and b_payload.get("sub") == "1")
    # 4b) 底座签发的令牌电商可验
    b_tok = base_jwt.encode_jwt({"sub": "9", "email": "b@example.com", "role": "viewer"},
                                SECRET, expires_in=3600)
    e_payload = auth.parse_access_token(b_tok, settings)
    _check("电商可验底座签发的令牌 sub", e_payload.get("sub") == "9")

    # 5) 运行态使用的实现来源
    print(f"[INFO] _HAS_BASE_JWT={auth._HAS_BASE_JWT}（底座未装则走内嵌等价实现）")

    print("\nALL PASS ✅  电商 P3 JWT 已收敛到 sakura_base 算法并兼容遗留令牌。")


if __name__ == "__main__":
    main()
