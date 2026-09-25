import os
import shutil
from typing import Union, BinaryIO
from app.core.config import settings


class LocalStorageBackend:
    def __init__(self, root_dir: str = settings.STORAGE_DIR):
        self.root_dir = os.path.abspath(root_dir)
        os.makedirs(self.root_dir, exist_ok=True)

    def save(self, file_content: Union[bytes, BinaryIO], destination_subpath: str) -> str:
        # Sanitize path to prevent directory traversal
        clean_subpath = destination_subpath.lstrip("/\\").replace("..", "")
        full_dest_path = os.path.join(self.root_dir, clean_subpath)
        os.makedirs(os.path.dirname(full_dest_path), exist_ok=True)

        if isinstance(file_content, bytes):
            with open(full_dest_path, "wb") as f:
                f.write(file_content)
        else:
            with open(full_dest_path, "wb") as f:
                shutil.copyfileobj(file_content, f)

        # Return standardized relative storage path
        return clean_subpath.replace("\\", "/")

    def get_url(self, stored_path: str) -> str:
        # Endpoint to serve through FastAPI /api/v1/evidence/... or static route
        clean_path = stored_path.lstrip("/\\")
        return f"/api/v1/storage/{clean_path}"

    def get_absolute_path(self, stored_path: str) -> str:
        clean_path = stored_path.lstrip("/\\").replace("..", "")
        return os.path.join(self.root_dir, clean_path)

    def delete(self, stored_path: str) -> None:
        full_path = self.get_absolute_path(stored_path)
        if os.path.exists(full_path):
            os.remove(full_path)


storage_backend = LocalStorageBackend()
