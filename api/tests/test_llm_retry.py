"""LLM 客户端重试韧性回归测试。

覆盖点（与 image/video 服务的 _post_dashscope_json 行为一致）：
- 瞬时网络故障（httpx.HTTPError，如 ConnectError/Timeout）应重试，最多 3 次，最终成功；
- 供应商明确错误（httpx.HTTPStatusError，如 401/429/5xx）不重试，立即抛出带详情的 LLMResponseError。
"""
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import httpx
import pytest

from app.services import llm as llm_module


def _fake_settings() -> SimpleNamespace:
    return SimpleNamespace(
        llm_base_url="https://example.com/v1",
        llm_api_key="test-key",
        llm_model="qwen-plus",
    )


def _make_client(post_side_effects: list) -> MagicMock:
    """构造一个 MagicMock 客户端，post 按 side_effects 顺序返回/抛出来模拟瞬时故障与成功。"""
    client_cm = MagicMock()
    client_cm.post.side_effect = post_side_effects
    client_inst = MagicMock()
    client_inst.__enter__.return_value = client_cm
    client_inst.__exit__.return_value = False
    return client_inst


def test_llm_client_retries_transient_http_error_then_succeeds():
    ok_response = MagicMock()
    ok_response.raise_for_status.return_value = None
    ok_response.json.return_value = {"choices": [{"message": {"content": '{"ok": true}'}}]}

    client_inst = _make_client([httpx.ConnectError("transient blip"), ok_response])

    with (
        patch("app.services.llm.httpx.Client", return_value=client_inst),
        patch("app.services.llm.time.sleep", lambda *a, **k: None),
    ):
        result = llm_module._post_chat_completion(
            settings=_fake_settings(),
            messages=[{"role": "user", "content": "x"}],
            max_tokens=100,
            temperature=0.1,
        )

    assert result == {"choices": [{"message": {"content": '{"ok": true}'}}]}
    # 第一次失败 + 第二次成功 = 共 2 次调用（确认发生了重试）。
    assert client_inst.__enter__.return_value.post.call_count == 2


def test_llm_client_does_not_retry_status_error():
    bad = MagicMock()
    bad.status_code = 401
    bad.json.return_value = {"error": "unauthorized"}
    bad.text = "unauthorized"
    bad.raise_for_status.side_effect = httpx.HTTPStatusError(
        "401", request=MagicMock(), response=bad
    )
    client_inst = _make_client([bad])

    with (
        patch("app.services.llm.httpx.Client", return_value=client_inst),
        patch("app.services.llm.time.sleep", lambda *a, **k: None),
        pytest.raises(llm_module.LLMResponseError),
    ):
        llm_module._post_chat_completion(
            settings=_fake_settings(),
            messages=[{"role": "user", "content": "x"}],
            max_tokens=100,
            temperature=0.1,
        )

    # 供应商明确错误：不重试，只调用 1 次。
    assert client_inst.__enter__.return_value.post.call_count == 1
