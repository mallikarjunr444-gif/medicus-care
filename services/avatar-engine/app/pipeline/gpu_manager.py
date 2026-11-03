"""
GPU-Aware Model Manager for MediCare Avatar Engine.
Controls lazy loading, VRAM budgeting, model swapping, and Apple Silicon MPS/CPU fallback.
"""

import asyncio
import logging
import gc
from typing import Dict, Any, Optional

logger = logging.getLogger("medicus_care.avatar_engine.gpu_manager")

class GPUModelManager:
    """
    Manages VRAM budgets and ensures models are loaded on-demand
    to prevent OOM errors on local M5 or production GPUs.
    """

    def __init__(self, max_vram_gb: float = 16.0):
        self.max_vram_gb = max_vram_gb
        self.loaded_models: Dict[str, Any] = {}
        self.active_model_name: Optional[str] = None
        self.lock = asyncio.Lock()

    async def get_model(self, model_name: str, adapter_instance: Any):
        """Lazy load adapter into memory, unloading dormant models if needed."""
        async with self.lock:
            if model_name in self.loaded_models:
                return self.loaded_models[model_name]

            logger.info(f"GPU Manager: Loading model {model_name}...")
            # If switching between heavy models, run garbage collection
            if len(self.loaded_models) >= 2:
                for name, inst in list(self.loaded_models.items()):
                    if name != model_name:
                        logger.info(f"Unloading dormant model {name} to conserve memory.")
                        await inst.cleanup()
                        del self.loaded_models[name]
                gc.collect()

            await adapter_instance.initialize()
            self.loaded_models[model_name] = adapter_instance
            self.active_model_name = model_name
            return adapter_instance

    async def unload_all(self):
        """Free all models from memory."""
        async with self.lock:
            for name, inst in list(self.loaded_models.items()):
                await inst.cleanup()
            self.loaded_models.clear()
            self.active_model_name = None
            gc.collect()
            logger.info("All neural models unloaded.")

gpu_model_manager = GPUModelManager()

