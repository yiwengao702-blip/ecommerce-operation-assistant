"""一次性脚本：为现有演示工作区补充若干虚拟店铺与商品（仅造数据，不改动业务接口）。

用法：在 api 目录下用项目 venv 运行
    D:/ecommerce-operation-assistant/api/.venv/Scripts/python.exe seed_extra_demo.py

幂等：以 external_store_id 去重；脚本开头会先清理旧版 seed-* 店铺，便于反复调整主题后重跑。
本版主题为「茶叶」：覆盖绿茶 / 红茶 / 白茶 / 普洱 / 乌龙，方便演示多品类茶饮运营。
"""
from decimal import Decimal

from app.db.session import SessionLocal, engine
from app.models import (
    InventoryItem,
    Platform,
    PlatformProductMapping,
    Product,
    ProductSku,
    Store,
)
from app.services.inventory import (
    create_inventory_item_for_sku,
)

# 需要补充的虚拟店铺：每店带若干茶叶商品与 SKU，平台覆盖淘宝 / 拼多多。
STORE_SPECS = [
    {
        "external_store_id": "seed-taobao-tea",
        "name": "淘宝茶叶旗舰店",
        "platform": Platform.TAOBAO,
        "owner_name": "茶事运营组",
        "products": [
            {
                "external_product_id": "seed-tb-molihua",
                "name": "茉莉花茶",
                "category": "花茶",
                "price": Decimal("88.00"),
                "cost": Decimal("32.00"),
                "target_audience": "喜欢清香柔和、日常口粮茶的女性与办公人群",
                "selling_points": ["七窨工艺", "花香鲜灵", "耐泡回甘"],
                "skus": [
                    {"sku_code": "TB-MLH-50", "name": "茉莉 50g 罐装", "qty": 80, "threshold": 20},
                    {"sku_code": "TB-MLH-100", "name": "茉莉 100g 礼盒", "qty": 60, "threshold": 15},
                ],
            },
            {
                "external_product_id": "seed-tb-guihua",
                "name": "桂花乌龙茶",
                "category": "乌龙茶",
                "price": Decimal("118.00"),
                "cost": Decimal("42.00"),
                "target_audience": "偏爱温润果香与秋日氛围感的乌龙茶友",
                "selling_points": ["桂花窨制", "醇厚顺滑", "冷热皆宜"],
                "skus": [
                    {"sku_code": "TB-GH-80", "name": "桂花乌龙 80g 罐装", "qty": 90, "threshold": 25},
                ],
            },
            {
                "external_product_id": "seed-tb-baicha",
                "name": "福鼎白茶饼 2019",
                "category": "白茶",
                "price": Decimal("198.00"),
                "cost": Decimal("70.00"),
                "target_audience": "收藏与日常煮饮兼顾的茶客",
                "selling_points": ["三年陈化", "枣香清润", "可藏可饮"],
                "skus": [
                    {"sku_code": "TB-BC-357", "name": "白茶饼 357g", "qty": 40, "threshold": 10},
                ],
            },
        ],
    },
    {
        "external_store_id": "seed-pdd-tea",
        "name": "拼多多产地直供",
        "platform": Platform.PINUODUODU,
        "owner_name": "源头茶厂",
        "products": [
            {
                "external_product_id": "seed-pdd-puer",
                "name": "云南普洱熟茶饼",
                "category": "黑茶",
                "price": Decimal("89.90"),
                "cost": Decimal("33.00"),
                "target_audience": "看重性价比与口粮茶的熟普爱好者",
                "selling_points": ["勐海发酵", "醇滑糯香", "口粮首选"],
                "skus": [
                    {"sku_code": "PD-PR-357", "name": "熟普 357g 饼", "qty": 150, "threshold": 40},
                    {"sku_code": "PD-PR-100", "name": "熟普 100g 小饼", "qty": 120, "threshold": 30},
                ],
            },
            {
                "external_product_id": "seed-pdd-tieguanyin",
                "name": "安溪铁观音乌龙茶",
                "category": "乌龙茶",
                "price": Decimal("99.00"),
                "cost": Decimal("38.00"),
                "target_audience": "喜欢兰花香与回甘的乌龙茶友",
                "selling_points": ["正韵兰花香", "七泡有余香", "高山茶青"],
                "skus": [
                    {"sku_code": "PD-TGY-250", "name": "铁观音 250g 袋装", "qty": 100, "threshold": 25},
                ],
            },
        ],
    },
]


def delete_old_seed_stores(db) -> int:
    """清理上一版 seed-* 店铺及其全部依赖行，保证主题切换后可安全重跑。"""
    old_stores = db.query(Store).filter(Store.external_store_id.like("seed-%")).all()
    removed = 0
    for store in old_stores:
        products = db.query(Product).filter(Product.store_id == store.id).all()
        for product in products:
            skus = db.query(ProductSku).filter(ProductSku.product_id == product.id).all()
            for sku in skus:
                # 库存快照删除会级联清理其库存流水。
                inv = db.query(InventoryItem).filter(InventoryItem.sku_id == sku.id).first()
                if inv is not None:
                    db.delete(inv)
                db.query(PlatformProductMapping).filter(
                    PlatformProductMapping.sku_id == sku.id
                ).delete()
                db.delete(sku)
            db.query(PlatformProductMapping).filter(
                PlatformProductMapping.product_id == product.id
            ).delete()
            db.delete(product)
        db.delete(store)
        removed += 1
    db.commit()
    return removed


def main() -> None:
    # 定位现有演示工作区：以已存在的演示店为锚点，把新店铺挂到同一工作区。
    with SessionLocal() as db:
        # 先清理旧版非茶种子数据，便于反复调整主题。
        removed = delete_old_seed_stores(db)
        if removed:
            print(f"已清理旧版 seed 店铺 {removed} 个。")

        anchor = (
            db.query(Store)
            .filter(Store.external_store_id == "demo-douyin-store")
            .first()
        )
        workspace_id = anchor.workspace_id if anchor else 1

        created_stores = 0
        created_products = 0
        for spec in STORE_SPECS:
            store = Store(
                workspace_id=workspace_id,
                name=spec["name"],
                platform=spec["platform"],
                external_store_id=spec["external_store_id"],
                owner_name=spec["owner_name"],
                note="虚拟演示数据（茶叶主题），用于丰富工作台样例。",
            )
            db.add(store)
            db.flush()
            created_stores += 1

            for p in spec["products"]:
                product = Product(
                    workspace_id=workspace_id,
                    store=store,
                    name=p["name"],
                    platform=spec["platform"],
                    category=p["category"],
                    price=p["price"],
                    cost=p["cost"],
                    target_audience=p["target_audience"],
                    selling_points=p["selling_points"],
                    external_product_id=p["external_product_id"],
                    platform_status="online",
                )
                db.add(product)
                db.flush()
                created_products += 1

                for sku in p["skus"]:
                    sku_obj = ProductSku(
                        product=product,
                        sku_code=sku["sku_code"],
                        name=sku["name"],
                        price=p["price"],
                        cost=p["cost"],
                    )
                    db.add(sku_obj)
                    db.flush()
                    create_inventory_item_for_sku(
                        db,
                        sku_obj,
                        initial_quantity=sku["qty"],
                        warning_threshold=sku["threshold"],
                        location="演示仓",
                        operator_name="系统演示",
                    )

        db.commit()
        print(
            f"完成：新增店铺 {created_stores} 个、商品 {created_products} 个（工作区 {workspace_id}）。"
        )


if __name__ == "__main__":
    main()
