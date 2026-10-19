"""add jd to products & competitors platform enum

修复模型/库表漂移：Python 侧 Platform 枚举含 "jd"（京东），
但早期迁移只把 "jd" 加进了 stores / platform_accounts /
platform_product_mappings / public_link_parse_tasks 四张表，
products 与 competitors 两张表的 platform 列仍是旧枚举，
导致任何使用 Platform.JD 的商品/竞品写入报
DataError 1265 "Data truncated for column 'platform'"。

Revision ID: f7d1a9c3e2b4
Revises: f4a9c2e7d1b6
Create Date: 2026-10-15 14:20:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "f7d1a9c3e2b4"
down_revision: str | None = "f4a9c2e7d1b6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# 旧枚举（不含 jd）：products / competitors 当前在库里的定义。
platform_enum_old = sa.Enum(
    "douyin",
    "taobao",
    "tmall",
    "pinduoduo",
    "tiktok_shop",
    "amazon",
    "other",
    name="platform",
)

# 新枚举（加入 jd）：与 Python 侧 app.models.Platform 保持一致。
platform_enum_new = sa.Enum(
    "douyin",
    "taobao",
    "tmall",
    "pinduoduo",
    "jd",
    "tiktok_shop",
    "amazon",
    "other",
    name="platform",
)


def upgrade() -> None:
    """把 products / competitors 两表的 platform 枚举扩到与模型一致（含 jd）。"""
    # MySQL 下 sa.Enum 是内联列类型（非命名类型），alter_column 会
    # 生成 MODIFY COLUMN ... ENUM(...)，直接扩值即可，无数据损失。
    op.alter_column(
        "products",
        "platform",
        existing_type=platform_enum_old,
        type_=platform_enum_new,
        existing_nullable=False,
    )
    op.alter_column(
        "competitors",
        "platform",
        existing_type=platform_enum_old,
        type_=platform_enum_new,
        existing_nullable=False,
    )


def downgrade() -> None:
    """回滚：收窄枚举前先清掉 jd 值，避免收窄时被 MySQL 拒绝。"""
    # 保守处理：先把两表 jd 值改回 douyin，再收窄枚举类型。
    op.execute("UPDATE products SET platform = 'douyin' WHERE platform = 'jd'")
    op.execute("UPDATE competitors SET platform = 'douyin' WHERE platform = 'jd'")
    op.alter_column(
        "products",
        "platform",
        existing_type=platform_enum_new,
        type_=platform_enum_old,
        existing_nullable=False,
    )
    op.alter_column(
        "competitors",
        "platform",
        existing_type=platform_enum_new,
        type_=platform_enum_old,
        existing_nullable=False,
    )
