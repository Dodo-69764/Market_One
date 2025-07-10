import logging
import json
import yaml
from pathlib import Path
from typing import Dict, Union


def setup_logging(log_file: str = "logs/main_scraper.log") -> None:
    """
    Configure logging for the project. Logs to both console and file.

    Args:
        log_file (str): File path to store log outputs.
    """
    Path(log_file).parent.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(message)s",
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(log_file, encoding="utf-8"),
        ],
    )


def save_json(path: Union[str, Path], data: Union[dict, list]) -> None:
    """
    Save a dictionary or list to a JSON file.

    Args:
        path (Union[str, Path]): Path to save the JSON file.
        data (Union[dict, list]): Data to be written.
    """
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_config(config_path: Union[str, Path] = "config.yaml") -> Dict:
    """
    Load configuration from a YAML file.

    Args:
        config_path (Union[str, Path]): Path to the YAML configuration file.

    Returns:
        Dict: Dictionary containing configuration settings.
    """
    config_path = Path(config_path)
    if not config_path.exists():
        logging.error(f"❌ Config file not found at: {config_path}")
        return {}

    try:
        with open(config_path, "r", encoding="utf-8") as file:
            return yaml.safe_load(file) or {}
    except yaml.YAMLError as e:
        logging.error(f"❌ YAML parsing error: {e}")
        return {}
