"""占位符密钥识别与“未配置”判定的回归测试。

背景：api/.env 曾长期保留模板占位值（如 LLM_API_KEY=<你的api-key>），
非空检查把它当成“已配置”，导致 LLM/图片/视频链路发起注定失败的畸形请求，
其中文请求头还会在 httpx 编码阶段抛出 UnicodeEncodeError 并击穿回退链。
本文件锁定占位符识别逻辑，防止回归。
"""

from types import SimpleNamespace

from app.core.config import is_placeholder_secret
from app.services.image_generation import is_image_generation_configured
from app.services.llm import is_llm_configured
from app.services.video_generation import is_video_generation_configured


def _runtime_settings(**overrides) -> SimpleNamespace:
    """构造或执行测试所需的运行态配置替身，让测试数据、依赖替身与断言保持集中。"""
    # 按 Arrange、Act、Assert 组织场景，重点检查可观察状态和副作用。
    base = {
        "llm_base_url": "https://api.example.com",
        "llm_api_key": "sk-real-looking-key-123456",
        "llm_model": "test-model",
        "image_provider": "dashscope",
        "image_base_url": "https://image.example.com",
        "image_api_key": "sk-real-image-key-123456",
        "image_model": "wan2.6-t2i",
        "video_provider": "dashscope",
        "video_base_url": "https://video.example.com",
        "video_api_key": "sk-real-video-key-123456",
        "video_model": "wan2.6-t2v",
    }
    base.update(overrides)
    return SimpleNamespace(**base)


def test_is_placeholder_secret_flags_template_values() -> None:
    """验证“占位密钥flags模板值”场景，确保重构后仍满足预期业务与安全边界。"""
    # 按 Arrange、Act、Assert 组织场景，重点检查可观察状态和副作用。
    placeholders = [
        None,
        "",
        "   ",
        "<你的api-key>",
        "replace_with_random_urlsafe_32_char_secret",
        "YOUR_API_KEY",
        "请在此填写密钥",
        "sk-中文提示未替换",
    ]

    for value in placeholders:
        assert is_placeholder_secret(value) is True, f"占位值应被识别: {value!r}"


def test_is_placeholder_secret_accepts_real_keys() -> None:
    """验证“真实密钥accepts”场景，确保重构后仍满足预期业务与安全边界。"""
    # 按 Arrange、Act、Assert 组织场景，重点检查可观察状态和副作用。
    real_keys = [
        "sk-real-looking-key-123456",
        "volc-ak:volc-sk",
        "env-text-key",
        "old-secret",
    ]

    for value in real_keys:
        assert is_placeholder_secret(value) is False, f"真实密钥不应被误判: {value!r}"


def test_llm_not_configured_when_key_is_placeholder() -> None:
    """验证“llm未配置when密钥is占位”场景，确保重构后仍满足预期业务与安全边界。"""
    # 按 Arrange、Act、Assert 组织场景，重点检查可观察状态和副作用。
    settings = _runtime_settings(llm_api_key="<你的api-key>")

    assert is_llm_configured(settings) is False


def test_llm_configured_with_real_key() -> None:
    """验证“llm已配置with真实密钥”场景，确保重构后仍满足预期业务与安全边界。"""
    # 按 Arrange、Act、Assert 组织场景，重点检查可观察状态和副作用。
    settings = _runtime_settings()

    assert is_llm_configured(settings) is True


def test_image_generation_not_configured_when_key_is_placeholder() -> None:
    """验证“图片生成未配置when密钥is占位”场景，确保重构后仍满足预期业务与安全边界。"""
    # 按 Arrange、Act、Assert 组织场景，重点检查可观察状态和副作用。
    settings = _runtime_settings(image_api_key="replace_with_your_image_key")

    assert is_image_generation_configured(settings) is False


def test_video_generation_not_configured_when_key_is_placeholder() -> None:
    """验证“视频生成未配置when密钥is占位”场景，确保重构后仍满足预期业务与安全边界。"""
    # 按 Arrange、Act、Assert 组织场景，重点检查可观察状态和副作用。
    settings = _runtime_settings(video_api_key="<你的视频密钥>")

    assert is_video_generation_configured(settings) is False
