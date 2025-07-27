import json
import boto3
import time
import random
from botocore.config import Config
from botocore.exceptions import ClientError

# 再試行設定：10回まで、自動リトライ＋標準的なバックオフ
boto_config = Config(retries={"max_attempts": 10, "mode": "standard"})

# Bedrock Claude 呼び出しクライアント
br = boto3.client("bedrock-runtime", region_name="ap-northeast-1", config=boto_config)

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def lambda_handler(event, context):
    # プリフライト対応
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    # リクエストボディ取得
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        body = {}

    client_messages = body.get("messages", [])
    model_messages = [
        {
            "role": "assistant",
            "content": "あなたは親切なアシスタントです。日本語で回答してください。",
        }
    ] + client_messages

    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "messages": model_messages,
        "max_tokens": 8192,
    }

    # ── ここからリトライ＋指数バックオフ実装 ──
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            response = br.invoke_model(
                modelId="anthropic.claude-3-5-sonnet-20240620-v1:0",
                contentType="application/json",
                accept="application/json",
                body=json.dumps(payload),
            )
            break  # 成功したらループを抜ける

        except ClientError as e:
            code = e.response.get("Error", {}).get("Code")
            if code == "ThrottlingException" and attempt < max_retries:
                # 待機時間：2^(attempt) 秒 ＋ 0～1 秒のランダム
                wait_time = (2**attempt) + random.random()
                print(
                    f"Throttling したので {wait_time:.1f}s 待ってリトライします… (試行 {attempt}/{max_retries})"
                )
                time.sleep(wait_time)
                continue  # 再試行
            else:
                # 上限超過や別エラーの場合はそのまま例外を投げる
                raise

    else:
        # 5 回全部失敗した場合
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps(
                {
                    "error": "モデル呼び出しに失敗しました（スロットリングが続いています）"
                }
            ),
        }
    # ── リトライ部分 終了 ──

    # レスポンス組み立て
    result_body = response["body"].read()
    reply_text = json.loads(result_body)["content"][0]["text"]

    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({"reply": reply_text}),
    }
