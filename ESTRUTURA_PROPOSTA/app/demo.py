"""
/app/demo.py
Placeholder — Demo Gradio para o Gemma 4 Good Hackathon.

Instalar dependências:
    pip install gradio pillow

Rodar:
    python app/demo.py
"""

# TODO: implementar após gemma4_integration.py estar funcional

# import gradio as gr
# from model.gemma4_integration import PictoricInterpreter
#
# interpreter = PictoricInterpreter()
#
# def process_image(image, context):
#     result = interpreter.interpret(image, context)
#     return (
#         result["intent"],
#         "\n".join(result["alternatives"]),
#         f"{result['confidence']:.0%}"
#     )
#
# with gr.Blocks(title="AFASIA — Motor Pictórico + Gemma 4") as demo:
#     gr.Markdown("# AFASIA\n### Comunicação Aumentativa com Inteligência Topológica")
#
#     with gr.Row():
#         with gr.Column():
#             image_input = gr.Image(label="Foto ou Pictograma", type="filepath")
#             context_input = gr.Textbox(
#                 label="Contexto clínico (opcional)",
#                 placeholder="Ex: adulto pós-AVC, afasia de Broca"
#             )
#             submit_btn = gr.Button("Interpretar", variant="primary")
#
#         with gr.Column():
#             intent_output = gr.Textbox(label="Intenção Principal")
#             alternatives_output = gr.Textbox(label="Alternativas", lines=3)
#             confidence_output = gr.Textbox(label="Confiança")
#
#     submit_btn.click(
#         fn=process_image,
#         inputs=[image_input, context_input],
#         outputs=[intent_output, alternatives_output, confidence_output]
#     )
#
# if __name__ == "__main__":
#     demo.launch()

raise NotImplementedError(
    "Demo Gradio ainda não implementada.\n"
    "Ver ROADMAP.md — Fase 2, Semana 3-4."
)
