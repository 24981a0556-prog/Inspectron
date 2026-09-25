from typing import Protocol, BinaryIO, Union
import os


class StorageBackend(Protocol):
    def save(self, file_content: Union[bytes, BinaryIO], destination_subpath: str) -> str:
        """
        Persists file bytes to storage under destination_subpath.
        Returns the logical stored path or key.
        """
        ...

    def get_url(self, stored_path: str) -> str:
        """
        Returns a URL or serve path for the stored file.
        """
        ...

    def get_absolute_path(self, stored_path: str) -> str:
        """
        Returns local filesystem absolute path if applicable.
        """
        ...

    def delete(self, stored_path: str) -> None:
        """
        Deletes stored file. Raises FileNotFoundError or IOError on failure.
        """
        ...
