"""
demo.py
Interface Gradio — AFASIA Motor Pictórico
Hackathon Gemma 4 Good 2026
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import gradio as gr
import json
from pathlib import Path

try:
    from model.gemma4_integration import PictoricInterpreter
    from tda_pictoric_analysis import generate_arasaac_embeddings, compute_alpha_persistence
    TDA_AVAILABLE = True
except ImportError as e:
    print(f"[AVISO] Importação parcial: {e}")
    TDA_AVAILABLE = False


interpreter = PictoricInterpreter()


def interpret_image(image, context, show_tda):
    """Função principal da interface Gradio."""
    if image is None:
        return "Carregue uma imagem ou pictograma.", "", ""

    tmp_path = "/tmp/gradio_input.png"
    if hasattr(image, 'save'):
        image.save(tmp_path)
    else:
        import shutil
        shutil.copy(image, tmp_path)

    result = interpreter.interpret(tmp_path, context)

    urgencia_emoji = {"ALTA": "🔴", "MEDIA": "🟡", "BAIXA": "🟢"}.get(
        result.get("urgencia", "MEDIA"), "🟡"
    )

    output_main = f"""INTENÇÃO DETECTADA
{result.get('intencao_principal', 'Não identificado')}

URGÊNCIA: {urgencia_emoji} {result.get('urgencia', 'MEDIA')}
CONFIANÇA: {result.get('confianca', 0):.0%}

FRASES SUGERIDAS:
"""
    for i, frase in enumerate(result.get('frases_sugeridas', []), 1):
        output_main += f"  {i}. {frase}\n"

    tda_output = ""
    if show_tda and TDA_AVAILABLE:
        try:
            X, _ = generate_arasaac_embeddings(n_samples=80, n_features=20)
            diag_H0, diag_H1 = compute_alpha_persistence(X)
            tda_output = (f"ASSINATURA TOPOLÓGICA\n"
                          f"H0 (conectividade): {len(diag_H0)} intervalos\n"
                          f"H1 (ciclos):        {len(diag_H1)} intervalos\n"
                          f"[Espaço G = I + F operando]")
        except Exception as e:
            tda_output = f"TDA indisponível: {e}"

    return output_main, json.dumps(result, indent=2, ensure_ascii=False), tda_output


with gr.Blocks(title="AFASIA — Motor Pictórico", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # AFASIA — Motor Pictórico
    ### Comunicação Alternativa para Afasia via IA Geométrica (G = I + F)
    Desenvolvido por João Pedro Passos | Gemma 4 Good Hackathon 2026
    """)

    with gr.Row():
        with gr.Column(scale=1):
            image_input = gr.Image(
                label="Pictograma ou foto",
                type="pil",
                height=300
            )
            context_input = gr.Textbox(
                label="Contexto clínico (opcional)",
                placeholder="Ex: Paciente pós-AVC, UTI, 70 anos",
                lines=2
            )
            show_tda = gr.Checkbox(
                label="Mostrar assinatura topológica (TDA)",
                value=False
            )
            btn = gr.Button("Interpretar", variant="primary", size="lg")

        with gr.Column(scale=1):
            output_main = gr.Textbox(
                label="Interpretação",
                lines=12,
                show_copy_button=True
            )
            output_json = gr.Code(
                label="JSON completo",
                language="json",
                lines=8
            )
            output_tda = gr.Textbox(
                label="Assinatura Topológica (G = I + F)",
                lines=5,
                visible=True
            )

    btn.click(
        fn=interpret_image,
        inputs=[image_input, context_input, show_tda],
        outputs=[output_main, output_json, output_tda]
    )

if __name__ == "__main__":
    demo.launch(share=False, server_name="0.0.0.0", server_port=7860)
