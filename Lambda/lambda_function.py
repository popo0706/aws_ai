import json
import base64
import time
import random
import os
import logging
import traceback

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# ── ロガー設定 ─────────────────────────────────────────
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# ── Bedrock クライアント ────────────────────────────────
br = boto3.client(
    "bedrock-runtime",
    region_name=os.environ.get("AWS_REGION", "ap-northeast-1"),
    config=Config(retries={"max_attempts": 10, "mode": "standard"}),
)


# ────────────────────────────────────────────────────
def lambda_handler(event, context):
    """
    Lambda Function URL 呼び出しハンドラ
    CORS は AWS Function URL 側で自動処理される想定のため、
    ここでは自前の CORS ヘッダーは返却しません。
    """

    # 1) 受信イベントをログ出力（先頭 500 文字）
    logger.info("▶▶▶ Incoming event:")
    logger.info(json.dumps(event, ensure_ascii=False)[:500])

    # 2) Body 取得（Base64 デコード対応）
    raw_body = event.get("body") or ""
    if event.get("isBase64Encoded"):
        raw_body = base64.b64decode(raw_body).decode("utf-8", errors="ignore")
    try:
        body = json.loads(raw_body) if raw_body else {}
    except json.JSONDecodeError:
        body = {}
    logger.info(f"payload from client: {body}")

    # 3) ユーザーからのメッセージ整形
    client_msgs = body.get("messages") or []
    if not client_msgs and (msg := body.get("message")):
        client_msgs = [{"role": "user", "content": msg}]

    model_msgs = [
        {
            "role": "assistant",
            "content": "あなたは親切なアシスタントです。日本語で回答してください。",
        }
    ] + client_msgs

    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "messages": model_msgs,
        "max_tokens": 2048,
    }

    # 4) Bedrock 呼び出し（指数バックオフ付きリトライ）
    try:
        for attempt in range(1, 6):
            try:
                res = br.invoke_model(
                    modelId="anthropic.claude-3-5-sonnet-20240620-v1:0",
                    contentType="application/json",
                    accept="application/json",
                    body=json.dumps(payload),
                )
                break  # 成功したらループを抜ける
            except ClientError as e:
                code = e.response["Error"]["Code"]
                logger.warning(f"Bedrock error {code} (attempt {attempt})")
                if code == "ThrottlingException" and attempt < 5:
                    time.sleep((2**attempt) + random.random())
                    continue
                raise  # その他のエラーは即終了
    except Exception as e:
        # 5) 例外時はステータス 500 と Content-Type のみ返却
        logger.error("★ Bedrock 呼び出し失敗", exc_info=True)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {"error": str(e), "trace": traceback.format_exc()[:800]}
            ),
        }

    # 6) 正常応答
    reply_text = json.loads(res["body"].read())["content"][0]["text"]
    logger.info(f"reply_text: {reply_text[:120]}…")

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"reply": reply_text}),
    }
