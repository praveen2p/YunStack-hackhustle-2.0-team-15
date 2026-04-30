from __future__ import annotations

import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.config import settings


ENCRYPTED_PREFIX = "ENC::"


def _key_bytes() -> bytes:
    material = settings.AES_256_KEY or settings.SECRET_KEY
    try:
        decoded = base64.urlsafe_b64decode(material)
        if len(decoded) == 32:
            return decoded
    except Exception:
        pass
    return hashlib.sha256(material.encode("utf-8")).digest()


def encrypt_bytes(data: bytes) -> bytes:
    aesgcm = AESGCM(_key_bytes())
    nonce = os.urandom(12)
    return nonce + aesgcm.encrypt(nonce, data, None)


def decrypt_bytes(data: bytes) -> bytes:
    if len(data) < 13:
        return data
    aesgcm = AESGCM(_key_bytes())
    nonce, ciphertext = data[:12], data[12:]
    try:
        return aesgcm.decrypt(nonce, ciphertext, None)
    except Exception:
        return data


def encrypt_text(value: str) -> str:
    if value.startswith(ENCRYPTED_PREFIX):
        return value
    encrypted = encrypt_bytes(value.encode("utf-8"))
    return ENCRYPTED_PREFIX + base64.urlsafe_b64encode(encrypted).decode("ascii")


def decrypt_text(value: str | None) -> str:
    if not value:
        return ""
    if not value.startswith(ENCRYPTED_PREFIX):
        return value
    payload = value.removeprefix(ENCRYPTED_PREFIX)
    try:
        encrypted = base64.urlsafe_b64decode(payload.encode("ascii"))
        return decrypt_bytes(encrypted).decode("utf-8")
    except Exception:
        return value
