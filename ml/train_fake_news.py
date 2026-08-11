"""Train a fake-news classifier on Kaggle's Fake and Real News Dataset.

Usage:
  python ml/train_fake_news.py --data-dir data
  python ml/train_fake_news.py --data-dir data --download

The Kaggle dataset contains Fake.csv and True.csv. Download it from:
https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset
"""
from __future__ import annotations

import argparse
import json
import re
import urllib.request
import zipfile
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

DATASET_URL = "https://www.kaggle.com/api/v1/datasets/download/clmentbisaillon/fake-and-real-news-dataset"


def clean_text(value: str) -> str:
    value = re.sub(r"[^a-zA-Z\s]", " ", str(value).lower())
    return re.sub(r"\s+", " ", value).strip()


def download_dataset(data_dir: Path) -> None:
    data_dir.mkdir(parents=True, exist_ok=True)
    archive = data_dir / "fake-real-news.zip"
    print("Downloading Kaggle dataset...")
    urllib.request.urlretrieve(DATASET_URL, archive)
    with zipfile.ZipFile(archive) as zipped:
        zipped.extractall(data_dir)
    archive.unlink(missing_ok=True)


def load_dataset(data_dir: Path) -> pd.DataFrame:
    fake_path, true_path = data_dir / "Fake.csv", data_dir / "True.csv"
    if not fake_path.exists() or not true_path.exists():
        raise FileNotFoundError("Expected Fake.csv and True.csv. Run again with --download.")
    fake = pd.read_csv(fake_path).assign(label=0)
    real = pd.read_csv(true_path).assign(label=1)
    frame = pd.concat([fake, real], ignore_index=True)
    frame["text"] = (frame.get("title", "").fillna("") + " " + frame.get("text", "").fillna("")).map(clean_text)
    return frame.loc[frame["text"].str.len() > 20, ["text", "label"]].sample(frac=1, random_state=42)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--output-dir", type=Path, default=Path("ml/artifacts"))
    args = parser.parse_args()
    if args.download:
        download_dataset(args.data_dir)
    frame = load_dataset(args.data_dir)
    x_train, x_test, y_train, y_test = train_test_split(frame.text, frame.label, test_size=0.2, random_state=42, stratify=frame.label)
    model = Pipeline([("tfidf", TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=2, max_df=0.95, sublinear_tf=True)), ("classifier", LogisticRegression(max_iter=1000, random_state=42))])
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    report = classification_report(y_test, predictions, target_names=["FAKE", "REAL"], output_dict=True)
    metrics = {"dataset": "Kaggle Fake and Real News Dataset", "samples": len(frame), "train_samples": len(x_train), "test_samples": len(x_test), "accuracy": accuracy_score(y_test, predictions), "precision": report["weighted avg"]["precision"], "recall": report["weighted avg"]["recall"], "f1": report["weighted avg"]["f1-score"], "confusion_matrix": confusion_matrix(y_test, predictions).tolist()}
    args.output_dir.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, args.output_dir / "fake_news_model.joblib")
    (args.output_dir / "metrics.json").write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
