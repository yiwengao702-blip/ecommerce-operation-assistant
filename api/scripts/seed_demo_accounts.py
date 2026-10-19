"""一次性脚本：为演示工作区补充三个固定演示账号（owner / operator / viewer）。

用法：在 api 目录下用项目 venv 运行
    D:/ecommerce-operation-assistant/api/.venv/Scripts/python.exe scripts/seed_demo_accounts.py

幂等：以邮箱去重，账号已存在则复用；密码统一为 demo123456，方便演示直接登录。
三个账号均绑定默认工作区（id=1），分别带 owner / operator / viewer 工作区角色，
用于演示 RBAC 权限差异（管理 / 运营 / 只读）。
"""
from app.db.session import SessionLocal
from app.models import UserRole
from app.services.bootstrap import ensure_bootstrap_user

# 固定演示账号：邮箱 + 展示名 + 角色。密码统一 demo123456，便于演示直接填登录页。
DEMO_ACCOUNTS = [
    {
        "email": "owner@example.com",
        "display_name": "演示管理员",
        "role": UserRole.OWNER,
        "password": "demo123456",
    },
    {
        "email": "operator@example.com",
        "display_name": "演示运营",
        "role": UserRole.OPERATOR,
        "password": "demo123456",
    },
    {
        "email": "viewer@example.com",
        "display_name": "演示只读",
        "role": UserRole.VIEWER,
        "password": "demo123456",
    },
]


def main() -> None:
    """批量确保三个演示账号存在，并汇报创建/复用结果。"""
    with SessionLocal() as db:
        for spec in DEMO_ACCOUNTS:
            user, created = ensure_bootstrap_user(
                db,
                email=spec["email"],
                display_name=spec["display_name"],
                password=spec["password"],
                role=spec["role"],
            )
            action = "已创建" if created else "已存在"
            print(
                f"{action}演示账号：{user.email} "
                f"（角色：{user.role.value} / 工作区角色：{spec['role'].value}）"
            )


if __name__ == "__main__":
    main()
