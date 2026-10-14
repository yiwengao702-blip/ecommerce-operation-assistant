"""诊断服务回归测试：锁定 raw_output.provider 必须反映运行态真实模型，不得硬编码 "deepseek"。

覆盖点：
- generate_llm_diagnosis 在切换供应商（如百炼 qwen-plus）后，溯源字段 provider 应等于运行态 llm_model；
- 同时确认 source=llm 且 model 透传自供应商响应。
"""
from types import SimpleNamespace
from unittest.mock import patch

from app.models import Product
from app.services import diagnosis as diagnosis_module
from app.services.diagnosis import generate_llm_diagnosis


def _fake_settings(model: str) -> SimpleNamespace:
    return SimpleNamespace(llm_model=model, llm_base_url="https://x", llm_api_key="y")


def test_llm_diagnosis_provider_reflects_runtime_model():
    fake_parsed = {
        "positioning": "差异化定位建议",
        "price_band": "中低价格带",
        "audience_insights": ["人群洞察1"],
        "pain_points": ["痛点1"],
        "selling_point_analysis": ["卖点分析1"],
        "risks": ["风险1"],
        "recommendations": ["下一步动作1"],
    }
    fake_raw = {"model": "qwen-plus", "usage": {"total_tokens": 123}}

    with (
        patch.object(diagnosis_module, "get_runtime_settings", return_value=_fake_settings("qwen-plus")),
        patch.object(
            diagnosis_module,
            "create_json_chat_completion",
            return_value=(fake_parsed, fake_raw),
        ),
        patch.object(
            diagnosis_module,
            "_build_diagnosis_messages",
            return_value=[{"role": "user", "content": "x"}],
        ),
    ):
        result = generate_llm_diagnosis(Product(name="测试商品"))

    assert result["source"] == "llm"
    assert result["raw_output"]["provider"] == "qwen-plus"
    assert result["raw_output"]["model"] == "qwen-plus"
    assert result["positioning"] == "差异化定位建议"
