"""一次性脚本：为现有演示工作区补充若干虚拟店铺与商品（仅造数据，不改动业务接口）。

用法：在 api 目录下用项目 venv 运行
    D:/ecommerce-operation-assistant/api/.venv/Scripts/python.exe seed_extra_demo.py

幂等：以 external_store_id 去重；脚本开头会先清理旧版 seed-* 店铺，便于反复调整主题后重跑。
本版为「综合多行业」演示：覆盖服饰 / 鞋包 / 数码 / 家电 / 食品 / 母婴 / 家居 /
美妆个护 / 运动户外 / 宠物等十余个品类，平台覆盖淘宝 / 天猫 / 拼多多 / 京东 / 抖音，
价格带从 ￥39 到 ￥1499，方便演示综合电商运营的多品类、多平台、多价格带场景。
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

# 需要补充的虚拟店铺：每店带若干商品与 SKU，覆盖多行业与多平台。
STORE_SPECS = [
    {
        "external_store_id": "seed-taobao-apparel",
        "name": "淘宝潮流服饰旗舰店",
        "platform": Platform.TAOBAO,
        "owner_name": "服饰运营组",
        "products": [
            {
                "external_product_id": "seed-tb-dress",
                "name": "法式针织连衣裙",
                "category": "服饰",
                "price": Decimal("259.00"),
                "cost": Decimal("88.00"),
                "target_audience": "追求通勤优雅与舒适度的都市女性",
                "selling_points": ["垂感不挑身材", "亲肤不扎人", "四季可叠穿"],
                "skus": [
                    {"sku_code": "TB-DR-S", "name": "连衣裙 S", "qty": 80, "threshold": 20},
                    {"sku_code": "TB-DR-M", "name": "连衣裙 M", "qty": 95, "threshold": 20},
                    {"sku_code": "TB-DR-L", "name": "连衣裙 L", "qty": 70, "threshold": 18},
                ],
            },
            {
                "external_product_id": "seed-tb-tshirt",
                "name": "男士纯棉基础T恤",
                "category": "服饰",
                "price": Decimal("79.00"),
                "cost": Decimal("22.00"),
                "target_audience": "喜欢基础百搭款的年轻男性",
                "selling_points": ["220g 重磅棉", "不易变形", "多色可选"],
                "skus": [
                    {"sku_code": "TB-TS-WM", "name": "T恤 白 M", "qty": 160, "threshold": 40},
                    {"sku_code": "TB-TS-BL", "name": "T恤 黑 L", "qty": 140, "threshold": 40},
                ],
            },
            {
                "external_product_id": "seed-tb-shoes",
                "name": "轻便缓震运动跑鞋",
                "category": "鞋包",
                "price": Decimal("329.00"),
                "cost": Decimal("110.00"),
                "target_audience": "日常跑步与通勤两用的运动人群",
                "selling_points": ["回弹中底", "透气飞织面", "防滑耐磨"],
                "skus": [
                    {"sku_code": "TB-SH-38", "name": "跑鞋 38", "qty": 60, "threshold": 15},
                    {"sku_code": "TB-SH-40", "name": "跑鞋 40", "qty": 85, "threshold": 20},
                    {"sku_code": "TB-SH-42", "name": "跑鞋 42", "qty": 70, "threshold": 18},
                ],
            },
            {
                "external_product_id": "seed-tb-backpack",
                "name": "简约通勤双肩包",
                "category": "鞋包",
                "price": Decimal("189.00"),
                "cost": Decimal("60.00"),
                "target_audience": "通勤与短途出差兼顾的上班族",
                "selling_points": ["15.6 寸电脑仓", "防泼水面料", "隐藏防盗袋"],
                "skus": [
                    {"sku_code": "TB-BP-01", "name": "双肩包 #深灰", "qty": 110, "threshold": 25},
                ],
            },
        ],
    },
    {
        "external_store_id": "seed-jd-digital",
        "name": "京东数码自营旗舰店",
        "platform": Platform.JD,
        "owner_name": "数码采销部",
        "products": [
            {
                "external_product_id": "seed-jd-headphone",
                "name": "无线主动降噪蓝牙耳机",
                "category": "数码",
                "price": Decimal("499.00"),
                "cost": Decimal("210.00"),
                "target_audience": "通勤地铁与办公降噪刚需人群",
                "selling_points": ["42dB 主动降噪", "单次续航 8 小时", "双设备秒切"],
                "skus": [
                    {"sku_code": "JD-HP-W", "name": "耳机 #白色", "qty": 90, "threshold": 22},
                    {"sku_code": "JD-HP-B", "name": "耳机 #黑色", "qty": 100, "threshold": 22},
                ],
            },
            {
                "external_product_id": "seed-jd-powerbank",
                "name": "20000mAh 双向快充充电宝",
                "category": "数码",
                "price": Decimal("129.00"),
                "cost": Decimal("48.00"),
                "target_audience": "出差旅行重度用电人群",
                "selling_points": ["22.5W 快充", "可上飞机", "数显电量"],
                "skus": [
                    {"sku_code": "JD-PB-20", "name": "充电宝 20000mAh", "qty": 180, "threshold": 40},
                ],
            },
            {
                "external_product_id": "seed-jd-watch",
                "name": "智能运动手表",
                "category": "数码",
                "price": Decimal("699.00"),
                "cost": Decimal("300.00"),
                "target_audience": "关注心率与运动数据记录的人群",
                "selling_points": ["血氧心率监测", "14 天续航", "100+ 运动模式"],
                "skus": [
                    {"sku_code": "JD-WT-01", "name": "手表 #硅胶黑", "qty": 65, "threshold": 15},
                    {"sku_code": "JD-WT-02", "name": "手表 #米兰带", "qty": 45, "threshold": 12},
                ],
            },
            {
                "external_product_id": "seed-jd-keyboard",
                "name": "客制化机械键盘",
                "category": "数码",
                "price": Decimal("359.00"),
                "cost": Decimal("150.00"),
                "target_audience": "程序员与电竞玩家的进阶外设需求",
                "selling_points": ["热插拔轴座", "三模连接", "Gasket 结构"],
                "skus": [
                    {"sku_code": "JD-KB-R", "name": "键盘 #红轴", "qty": 70, "threshold": 18},
                    {"sku_code": "JD-KB-B", "name": "键盘 #茶轴", "qty": 60, "threshold": 18},
                ],
            },
        ],
    },
    {
        "external_store_id": "seed-tmall-appliance",
        "name": "天猫家电官方旗舰店",
        "platform": Platform.TMALL,
        "owner_name": "家电事业部",
        "products": [
            {
                "external_product_id": "seed-tm-airfryer",
                "name": "可视化大容量空气炸锅",
                "category": "家电",
                "price": Decimal("399.00"),
                "cost": Decimal("160.00"),
                "target_audience": "追求少油健康烹饪的家庭用户",
                "selling_points": ["5L 大容量", "可视窗免开盖", "一锅多功能"],
                "skus": [
                    {"sku_code": "TM-AF-5", "name": "空气炸锅 5L", "qty": 95, "threshold": 22},
                ],
            },
            {
                "external_product_id": "seed-tm-robotvac",
                "name": "全自动扫地机器人",
                "category": "家电",
                "price": Decimal("1499.00"),
                "cost": Decimal("720.00"),
                "target_audience": "双职工与养宠家庭的地面清洁刚需",
                "selling_points": ["激光导航建图", "自动集尘", "扫拖一体"],
                "skus": [
                    {"sku_code": "TM-RV-01", "name": "扫地机 标准版", "qty": 40, "threshold": 10},
                    {"sku_code": "TM-RV-02", "name": "扫地机 自集尘版", "qty": 28, "threshold": 8},
                ],
            },
            {
                "external_product_id": "seed-tm-hairdryer",
                "name": "高速负离子电吹风",
                "category": "家电",
                "price": Decimal("299.00"),
                "cost": Decimal("110.00"),
                "target_audience": "追求速干与护发的长发人群",
                "selling_points": ["11 万转高速马达", "负离子护发", "恒温不伤发"],
                "skus": [
                    {"sku_code": "TM-HD-01", "name": "电吹风 #珠光白", "qty": 120, "threshold": 30},
                ],
            },
            {
                "external_product_id": "seed-tm-blender",
                "name": "破壁多功能料理机",
                "category": "家电",
                "price": Decimal("459.00"),
                "cost": Decimal("190.00"),
                "target_audience": "注重健康饮食与辅食制作的家庭",
                "selling_points": ["高硼玻璃杯", "12 档调速", "可拆洗刀头"],
                "skus": [
                    {"sku_code": "TM-BL-01", "name": "料理机 标准款", "qty": 88, "threshold": 20},
                ],
            },
        ],
    },
    {
        "external_store_id": "seed-pdd-food",
        "name": "拼多多食品生鲜直供",
        "platform": Platform.PINUODUODU,
        "owner_name": "源头食品供应链",
        "products": [
            {
                "external_product_id": "seed-pdd-nuts",
                "name": "每日坚果混合装",
                "category": "食品",
                "price": Decimal("59.90"),
                "cost": Decimal("28.00"),
                "target_audience": "注重健康零食的上班族与学生",
                "selling_points": ["30 小包独立装", "7 种坚果果干", "无添加蔗糖"],
                "skus": [
                    {"sku_code": "PD-NT-30", "name": "坚果 30 日装", "qty": 300, "threshold": 70},
                ],
            },
            {
                "external_product_id": "seed-pdd-coffee",
                "name": "冷萃挂耳咖啡",
                "category": "食品",
                "price": Decimal("89.00"),
                "cost": Decimal("32.00"),
                "target_audience": "办公室手冲爱好者与咖啡因刚需人群",
                "selling_points": ["中深烘焙", "锁鲜氮气包装", "一盒 30 片"],
                "skus": [
                    {"sku_code": "PD-CF-30", "name": "挂耳 30 片装", "qty": 240, "threshold": 60},
                ],
            },
            {
                "external_product_id": "seed-pdd-snackbox",
                "name": "休闲零食大礼包",
                "category": "食品",
                "price": Decimal("49.90"),
                "cost": Decimal("20.00"),
                "target_audience": "追剧囤货与节日送礼人群",
                "selling_points": ["20 款混合零食", "大容量礼箱", "日期新鲜"],
                "skus": [
                    {"sku_code": "PD-SK-20", "name": "零食礼包 20 款", "qty": 210, "threshold": 50},
                ],
            },
            {
                "external_product_id": "seed-pdd-rice",
                "name": "东北五常大米 10kg",
                "category": "食品",
                "price": Decimal("119.00"),
                "cost": Decimal("68.00"),
                "target_audience": "注重主食品质的家庭用户",
                "selling_points": ["五常核心产区", "当季新米", "真空锁鲜装"],
                "skus": [
                    {"sku_code": "PD-RC-10", "name": "五常大米 10kg", "qty": 150, "threshold": 40},
                ],
            },
        ],
    },
    {
        "external_store_id": "seed-douyin-mom",
        "name": "抖音母婴严选",
        "platform": Platform.DOUYIN,
        "owner_name": "母婴选品组",
        "products": [
            {
                "external_product_id": "seed-dy-diaper",
                "name": "超薄透气婴儿纸尿裤",
                "category": "母婴",
                "price": Decimal("139.00"),
                "cost": Decimal("58.00"),
                "target_audience": "对透气性与红屁屁敏感的新手宝妈",
                "selling_points": ["3D 透气芯体", "超薄亲肤", "尿显提示"],
                "skus": [
                    {"sku_code": "DY-DP-M", "name": "纸尿裤 M 码", "qty": 130, "threshold": 35},
                    {"sku_code": "DY-DP-L", "name": "纸尿裤 L 码", "qty": 120, "threshold": 35},
                ],
            },
            {
                "external_product_id": "seed-dy-blocks",
                "name": "益智大颗粒积木套装",
                "category": "母婴",
                "price": Decimal("159.00"),
                "cost": Decimal("55.00"),
                "target_audience": "2-6 岁儿童家长的启蒙玩具需求",
                "selling_points": ["食品级安全材质", "大颗粒防误吞", "附拼搭图册"],
                "skus": [
                    {"sku_code": "DY-BK-01", "name": "积木 120 粒装", "qty": 100, "threshold": 25},
                ],
            },
            {
                "external_product_id": "seed-dy-cereal",
                "name": "婴儿有机辅食米粉",
                "category": "母婴",
                "price": Decimal("79.00"),
                "cost": Decimal("30.00"),
                "target_audience": "6 月龄起添加辅食的宝宝家庭",
                "selling_points": ["有机认证", "高铁配方", "细腻易冲调"],
                "skus": [
                    {"sku_code": "DY-CR-01", "name": "米粉 原味 250g", "qty": 160, "threshold": 40},
                ],
            },
        ],
    },
    {
        "external_store_id": "seed-taobao-home",
        "name": "淘宝家居生活馆",
        "platform": Platform.TAOBAO,
        "owner_name": "家居运营组",
        "products": [
            {
                "external_product_id": "seed-tb-bedding",
                "name": "全棉磨毛四件套",
                "category": "家居",
                "price": Decimal("249.00"),
                "cost": Decimal("95.00"),
                "target_audience": "注重床品亲肤与保暖的秋冬换季家庭",
                "selling_points": ["60 支长绒棉", "磨毛保暖", "不易掉色起球"],
                "skus": [
                    {"sku_code": "TB-BD-15", "name": "四件套 1.5m", "qty": 85, "threshold": 20},
                    {"sku_code": "TB-BD-18", "name": "四件套 1.8m", "qty": 95, "threshold": 22},
                ],
            },
            {
                "external_product_id": "seed-tb-storage",
                "name": "折叠布艺收纳箱三件套",
                "category": "家居",
                "price": Decimal("69.00"),
                "cost": Decimal("24.00"),
                "target_audience": "小户型与换季衣物收纳人群",
                "selling_points": ["可折叠省空间", "加固提手", "透气防尘"],
                "skus": [
                    {"sku_code": "TB-ST-3", "name": "收纳箱 三件套 #米白", "qty": 220, "threshold": 50},
                ],
            },
            {
                "external_product_id": "seed-tb-aroma",
                "name": "无火香薰礼盒",
                "category": "家居",
                "price": Decimal("129.00"),
                "cost": Decimal("40.00"),
                "target_audience": "注重居家氛围与送礼需求的品质人群",
                "selling_points": ["天然植物精油", "留香 60 天", "高级礼盒包装"],
                "skus": [
                    {"sku_code": "TB-AR-01", "name": "香薰 #白茶", "qty": 140, "threshold": 35},
                    {"sku_code": "TB-AR-02", "name": "香薰 #雪松", "qty": 120, "threshold": 35},
                ],
            },
        ],
    },
    {
        "external_store_id": "seed-pdd-beauty",
        "name": "拼多多美妆个护直供",
        "platform": Platform.PINUODUODU,
        "owner_name": "个护供应链",
        "products": [
            {
                "external_product_id": "seed-pdd-cleanser",
                "name": "氨基酸温和洁面乳",
                "category": "美妆",
                "price": Decimal("39.90"),
                "cost": Decimal("12.00"),
                "target_audience": "敏感肌与晨间洁面人群",
                "selling_points": ["氨基酸表活", "洗后不紧绷", "泡沫细腻"],
                "skus": [
                    {"sku_code": "PD-CL-120", "name": "洁面 120g", "qty": 260, "threshold": 60},
                ],
            },
            {
                "external_product_id": "seed-pdd-mask",
                "name": "玻尿酸补水面膜",
                "category": "美妆",
                "price": Decimal("49.90"),
                "cost": Decimal("15.00"),
                "target_audience": "熬夜后急救补水的年轻学生党",
                "selling_points": ["一盒 20 片", "15 分钟急速补水", "独立包装卫生"],
                "skus": [
                    {"sku_code": "PD-MK-20", "name": "面膜 20 片装", "qty": 280, "threshold": 60},
                ],
            },
            {
                "external_product_id": "seed-pdd-menshampoo",
                "name": "男士控油去屑洗发水",
                "category": "个护",
                "price": Decimal("59.00"),
                "cost": Decimal("18.00"),
                "target_audience": "头皮易出油有头屑的男性人群",
                "selling_points": ["控油去屑双效", "无硅油清爽", "大瓶耐用"],
                "skus": [
                    {"sku_code": "PD-SH-500", "name": "洗发水 500ml", "qty": 190, "threshold": 45},
                ],
            },
        ],
    },
    {
        "external_store_id": "seed-jd-sports",
        "name": "京东运动户外专营店",
        "platform": Platform.JD,
        "owner_name": "运动户外部",
        "products": [
            {
                "external_product_id": "seed-jd-yogamat",
                "name": "加厚防滑瑜伽垫",
                "category": "运动户外",
                "price": Decimal("89.00"),
                "cost": Decimal("28.00"),
                "target_audience": "居家健身与瑜伽初学者",
                "selling_points": ["8mm 加厚回弹", "双面防滑", "附绑带便携"],
                "skus": [
                    {"sku_code": "JD-YG-08", "name": "瑜伽垫 8mm #紫", "qty": 170, "threshold": 40},
                ],
            },
            {
                "external_product_id": "seed-jd-tent",
                "name": "轻量化折叠露营帐篷",
                "category": "运动户外",
                "price": Decimal("399.00"),
                "cost": Decimal("175.00"),
                "target_audience": "周末露营与公园野餐家庭",
                "selling_points": ["3 秒速开", "防雨防晒", "收纳仅 60cm"],
                "skus": [
                    {"sku_code": "JD-TN-3P", "name": "帐篷 3 人款", "qty": 70, "threshold": 18},
                ],
            },
            {
                "external_product_id": "seed-jd-rope",
                "name": "智能计数无绳跳绳",
                "category": "运动户外",
                "price": Decimal("59.00"),
                "cost": Decimal("18.00"),
                "target_audience": "居家减脂与碎片化运动人群",
                "selling_points": ["无绳防绊", "APP 计数", "静音不扰邻"],
                "skus": [
                    {"sku_code": "JD-RP-01", "name": "跳绳 #黑", "qty": 230, "threshold": 55},
                ],
            },
        ],
    },
    {
        "external_store_id": "seed-tmall-pet",
        "name": "天猫宠物生活旗舰店",
        "platform": Platform.TMALL,
        "owner_name": "宠物事业部",
        "products": [
            {
                "external_product_id": "seed-tm-catfood",
                "name": "全价冻干主粮猫粮",
                "category": "宠物",
                "price": Decimal("169.00"),
                "cost": Decimal("72.00"),
                "target_audience": "注重营养均衡的养猫家庭",
                "selling_points": ["高肉含量", "冻干双拼", "全阶段适用"],
                "skus": [
                    {"sku_code": "TM-CF-15", "name": "猫粮 1.5kg", "qty": 160, "threshold": 40},
                    {"sku_code": "TM-CF-5", "name": "猫粮 5kg 囤货装", "qty": 80, "threshold": 20},
                ],
            },
            {
                "external_product_id": "seed-tm-litter",
                "name": "豆腐混合猫砂",
                "category": "宠物",
                "price": Decimal("59.00"),
                "cost": Decimal("22.00"),
                "target_audience": "追求结团与除臭的养猫人群",
                "selling_points": ["快速结团", "强力除臭", "可冲厕所"],
                "skus": [
                    {"sku_code": "TM-LT-6", "name": "猫砂 6L", "qty": 200, "threshold": 50},
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
        # 先清理旧版 seed-* 种子数据，便于反复调整主题后重跑。
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
                note="虚拟演示数据（综合多行业），用于丰富工作台样例。",
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
