# ▼今回のポイント・用語まとめ
# ・環境変数　　　: .env ファイルなどに隠しておく設定値のこと
# ・AWS Bedrock　 : AWS が提供する生成 AI（LLM）をまとめて呼び出せるサービス
# ・boto3　　　　  : AWS を Python から操作するための公式ライブラリ
# ・推論プロファイル: ON-DEMAND 非対応モデルを動かすための『設定テンプレート』
# ・リクエスト形式: messages = [{role, content[{text}]}] という入れ子構造で送る

"""
このスクリプトは
1. .env から AWS 資格情報を読み込み
2. boto3 を使って AWS Bedrock 上の Claude 3 Sonnet モデルにアクセスし
3. ユーザーが入力した「こんにちは」を送信して
4. 生成されたテキストをターミナルに表示します。

初心者でも読めるように、1 行ごとに“なぜ必要か”を説明しています。
"""

# ----- ライブラリの読み込み -----  (コードは変更せず、コメントだけ追加)
import os  # OS(パソコンの基本機能) を操作するための標準ライブラリ
from dotenv import load_dotenv  # .env ファイルから環境変数を読み込む便利ツール
import boto3  # AWS を Python で操作するための公式 SDK
import json  # JSON データを扱うための標準ライブラリ

load_dotenv()  # .env 内の AWS_ACCESS_KEY などを環境変数として取り込む

# ★Bedrock の長期／短期 API キーを直に指定する場合は以下の記述
# os.environ["AWS_BEARER_TOKEN_BEDROCK"] = (
#    "bedrock-api-key-samplexx"
# )

# ↓ AWS に接続するための「セッション」を作る。資格情報は環境変数から自動取得される
session = boto3.Session()

# ↓ Bedrock の実行専用クライアントを作成。東京リージョン(ap-northeast-1)を指定
client = session.client("bedrock-runtime", region_name="ap-northeast-1")

# ON-DEMAND非対応モデル → 推論プロファイル経由
# $ aws bedrock list-inference-profiles
# ↑で出てくる、"inferenceProfileId": "apac.sample"を指定すること。
# ------------------------------------------------------------
# ※上記コメントは AWS CLI で事前に確認せよ、という開発メモです (参考:https://docs.aws.amazon.com/)
# ------------------------------------------------------------

model_id = "apac.anthropic.claude-3-7-sonnet-20250219-v1:0"  # 使いたいモデルの ID を文字列で指定

# ----------- 実際にモデルへメッセージを送る ------------
response = client.converse(  # Bedrock へリクエストを投げるメイン呼び出し
    modelId=model_id,  # どのモデルを使うか
    messages=[  # 会話の履歴をリストで渡す
        {
            "role": "user",  # 送信者の立場。今回は「ユーザ」
            "content": [  # Claude 3 系モデルの仕様で、さらにリストにする
                {"text": "こんにちは"}  # 実際にモデルへ渡すテキスト
            ],
        }
    ],
)

# ----------- 返ってきた結果を取り出して表示------------
print(
    response["output"]["message"]["content"][0][
        "text"
    ]  # ネストが深いので順にキーをたどる
)  # ← 生成 AI が返してきた文章がターミナルに表示される
