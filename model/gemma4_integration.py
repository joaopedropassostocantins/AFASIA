"""
gemma4_integration.py
Integração Gemma 4 (Google Generative AI) com Motor Pictórico
Contexto: Hackathon Gemma 4 Good — Afasia/Disfasia
"""

import os
import json
import base64
from pathlib import Path
from typing import Optional

try:
    import google.generativeai as genai
    GEMMA_AVAILABLE = True
except ImportError:
    GEMMA_AVAILABLE = False


SYSTEM_PROMPT = """Você é um assistente especializado em comunicação alternativa
para pacientes com afasia ou disfasia. Recebe imagens de pictogramas ou fotos
de objetos/situações e deve:
1. Identificar o conceito ou necessidade representada
2. Gerar frases curtas (até 8 palavras) em português brasileiro
3. Sugerir 3 alternativas de interpretação em ordem de probabilidade
4. Classificar a urgência: ALTA (dor/emergência), MEDIA (necessidade), BAIXA (preferência)

Responda SEMPRE em JSON válido com a estrutura:
{
  "intencao_principal": "string",
  "urgencia": "ALTA|MEDIA|BAIXA",
  "frases_sugeridas": ["string", "string", "string"],
  "confianca": 0.0
}"""


class PictoricInterpreter:
    """
    Interpretador de intenções comunicativas via Gemma 4 + Motor Pictórico.
    Ponte entre percepção visual (pictogramas) e intenção comunicativa.
    """

    def __init__(self, model_name: str = "gemma-4-31b-it"):
        self.model_name = model_name
        self.api_key = os.environ.get("GOOGLE_API_KEY", "")
        self._model = None

        if GEMMA_AVAILABLE and self.api_key:
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=SYSTEM_PROMPT
            )
            print(f"Gemma 4 inicializado: {self.model_name}")
        else:
            print("[AVISO] GOOGLE_API_KEY não encontrada. "
                  "Executando em modo simulado.")

    def _image_to_part(self, image_path: str) -> dict:
        """Converte imagem para formato Part da API Gemma."""
        path = Path(image_path)
        mime_types = {'.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                      '.png': 'image/png', '.webp': 'image/webp'}
        mime = mime_types.get(path.suffix.lower(), 'image/jpeg')

        with open(image_path, 'rb') as f:
            data = base64.b64encode(f.read()).decode('utf-8')

        return {"inline_data": {"mime_type": mime, "data": data}}

    def interpret(self, image_path: str, context: str = "") -> dict:
        """
        Interpreta uma imagem/pictograma e retorna intenção comunicativa.

        Args:
            image_path: Caminho para o pictograma ou foto.
            context: Contexto adicional (ex: "paciente em UTI").

        Returns:
            dict com intencao_principal, urgencia, frases_sugeridas, confianca.
        """
        if self._model is None:
            return self._simulate(image_path, context)

        try:
            prompt_parts = []
            if Path(image_path).exists():
                prompt_parts.append(self._image_to_part(image_path))

            prompt_text = "Analise esta imagem e identifique a intenção comunicativa."
            if context:
                prompt_text += f" Contexto: {context}."
            prompt_parts.append(prompt_text)

            response = self._model.generate_content(prompt_parts)
            text = response.text.strip()

            # Remove blocos de código se presentes
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]

            return json.loads(text)

        except Exception as e:
            print(f"[ERRO Gemma 4] {e}")
            return self._simulate(image_path, context)

    def _simulate(self, image_path: str, context: str = "") -> dict:
        """Modo simulado para desenvolvimento sem API key."""
        return {
            "intencao_principal": "Necessidade básica: hidratação",
            "urgencia": "MEDIA",
            "frases_sugeridas": [
                "Quero água",
                "Estou com sede",
                "Pode me dar água?"
            ],
            "confianca": 0.91,
            "_modo": "simulado — configure GOOGLE_API_KEY"
        }

    def batch_interpret(self, image_paths: list, context: str = "") -> list:
        """Interpreta múltiplos pictogramas em sequência."""
        return [self.interpret(p, context) for p in image_paths]


if __name__ == "__main__":
    interpreter = PictoricInterpreter()
    result = interpreter.interpret(
        "data/arasaac/test.png",
        "Paciente de 65 anos após AVC em ambiente hospitalar"
    )
    print(json.dumps(result, indent=2, ensure_ascii=False))
