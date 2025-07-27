import json
import boto3

# Bedrock Claude 呼び出しクライアント
br = boto3.client("bedrock-runtime", region_name="ap-northeast-1")

# CORS 用ヘッダー
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",  # 本番は絞ってください
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def lambda_handler(event, context):

    # デバッグ用
    print(">>> Lambda start, event:", json.dumps(event, ensure_ascii=False))

    # 1) プリフライト OPTIONS 対応
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    # 2) リクエストボディの取得
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        body = {}

    # 3) フロントから送られてくる会話履歴
    client_messages = body.get("messages", [])
    # システムプロンプトを先頭に入れる
    model_messages = [
        {
            "role": "assistant",
            "content": "あなたは親切なアシスタントです。日本語で回答してください。",
        }
    ] + client_messages

    # 4) Bedrock Claude 用ペイロード
    payload = {
        "anthropic_version": "bedrock-2023-05-31",
        "messages": model_messages,
        "max_tokens": 256,
    }

    # デバッグ用
    print(">>> Parsed body:", event.get("body"))

    # 5) Claude 呼び出し
    res = br.invoke_model(
        modelId="anthropic.claude-3-haiku-20240307-v1:0",
        contentType="application/json",
        accept="application/json",
        body=json.dumps(payload),
    )

    # 6) 応答テキストを取り出す
    result_body = res["body"].read()
    reply_text = json.loads(result_body)["content"][0]["text"]

    # デバッグ用
    print(">>> reply_text:", reply_text)

    # 7) レスポンス返却（CORS ヘッダー付き）
    return {
        "statusCode": 200,
        "headers": CORS_HEADERS,
        "body": json.dumps({"reply": reply_text}),
    }
