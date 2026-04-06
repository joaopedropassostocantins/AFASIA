"""
/model/gemma4_integration.py
Placeholder — Integração com Gemma 4 via Kaggle Models ou HuggingFace.

TODO: implementar PictoricInterpreter usando Gemma 4 multimodal.
"""

# ==============================================================
# OPÇÃO A: Via Kaggle Models (dentro de notebook Kaggle)
# ==============================================================
# import kaggle_gcs
# from transformers import AutoTokenizer, AutoModelForCausalLM
#
# model_id = "google/gemma-4-27b-it"  # ajustar conforme disponibilidade
# tokenizer = AutoTokenizer.from_pretrained(model_id)
# model = AutoModelForCausalLM.from_pretrained(model_id, device_map="cpu")

# ==============================================================
# OPÇÃO B: Via Google AI Studio API (recomendado para demo)
# ==============================================================
# import google.generativeai as genai
# genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
# model = genai.GenerativeModel("gemma-4-27b-it")

# ==============================================================
# INTERFACE ESPERADA
# ==============================================================

class PictoricInterpreter:
    """
    Interpreta imagens/pictogramas usando Gemma 4 e mapeia
    para intenções comunicativas (para pacientes com afasia).

    Uso esperado:
        interpreter = PictoricInterpreter()
        result = interpreter.interpret(image_path="foto_paciente.jpg")
        # result = {
        #   "intent": "Quero água",
        #   "confidence": 0.92,
        #   "alternatives": ["Tenho sede", "Pode me ajudar?"],
        #   "pictogram_matched": "agua.png"
        # }
    """

    def __init__(self, model_name: str = "gemma-4-27b-it"):
        self.model_name = model_name
        # TODO: inicializar modelo Gemma 4
        raise NotImplementedError("Implementar integração Gemma 4 — ver ROADMAP.md Fase 1")

    def interpret(self, image_path: str, context: str = "") -> dict:
        """
        Args:
            image_path: caminho para imagem (foto do paciente ou pictograma)
            context: contexto clínico opcional ("afasia de Broca", "criança 8 anos")

        Returns:
            dict com intent, confidence, alternatives, pictogram_matched
        """
        # TODO: implementar
        raise NotImplementedError

    def batch_interpret(self, image_paths: list, context: str = "") -> list:
        """Interpreta múltiplas imagens em lote."""
        return [self.interpret(p, context) for p in image_paths]
