"""
AFASIA — Main runner para o PictoricAgent standalone.

Uso:
  python main.py                     # roda todos os jogos (modo competição)
  python main.py --game=ls20         # roda um jogo específico
  python main.py --game=ls20 --steps=100  # limita a 100 ações

Pré-requisitos:
  pip install arc-agi
  export ARC_API_KEY="sua-chave"
"""

import os
import sys
import time
import argparse
import logging

# Instalação automática do SDK
try:
    import arc_agi
except ModuleNotFoundError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "arc-agi", "-q"])
    import arc_agi

from arcengine import FrameData, FrameDataRaw, GameAction, GameState
from pictoric_agent import PictoricAgent, extract_grid_from_frame

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger()


def load_api_key() -> str:
    """Carrega a API key. Aborta se não encontrar."""
    try:
        from kaggle_secrets import UserSecretsClient
        key = UserSecretsClient().get_secret("ARC_API_KEY")
        if key:
            os.environ["ARC_API_KEY"] = key
            print("✅ API Key via Kaggle Secrets")
            return key
    except Exception:
        pass

    key = os.environ.get("ARC_API_KEY", "").strip()
    if key:
        print("✅ API Key via variável de ambiente")
        return key

    print("=" * 60)
    print("⚠️  ERRO CRÍTICO: ARC_API_KEY NÃO ENCONTRADA!")
    print("   → No Kaggle: Add-ons > Secrets > ARC_API_KEY")
    print("   → Local: export ARC_API_KEY='sua-chave'")
    print("=" * 60)
    sys.exit(1)


def convert_raw_frame(raw: FrameDataRaw | None) -> FrameData:
    """Converte FrameDataRaw → FrameData (mesmo que a classe base faz)."""
    if raw is None:
        raise ValueError("Received None frame data")
    return FrameData(
        game_id=raw.game_id,
        frame=[arr.tolist() for arr in raw.frame],
        state=raw.state,
        levels_completed=raw.levels_completed,
        win_levels=raw.win_levels,
        guid=raw.guid,
        full_reset=raw.full_reset,
        available_actions=raw.available_actions,
    )


def play_game(arc, game_id: str, max_actions: int = 200) -> int:
    """Executa o PictoricAgent num jogo usando a mesma lógica do framework."""
    env = arc.make(game_id)
    if env is None:
        print(f"  ✗ Falha ao criar ambiente {game_id}")
        return 0

    # Cria o agente
    agent = PictoricAgent(
        card_id="standalone",
        game_id=game_id,
        agent_name="pictoricagent",
        ROOT_URL="",
        record=False,
        arc_env=env,
    )
    agent.MAX_ACTIONS = max_actions

    # Frame inicial vazio
    frames: list[FrameData] = [FrameData(levels_completed=0)]

    print(f"\n  ▶ Jogando {game_id}")

    for step in range(max_actions):
        # Obtém o frame mais recente do ambiente
        raw_obs = env.observation_space
        try:
            latest_frame = convert_raw_frame(raw_obs)
        except (ValueError, Exception):
            latest_frame = frames[-1]

        # O agente decide
        action = agent.choose_action(frames, latest_frame)

        # Executa a ação
        if action == GameAction.RESET:
            raw = env.reset()
        else:
            data = {}
            if hasattr(action, 'action_data') and action.action_data:
                data = action.action_data.model_dump()
            elif action.is_complex():
                # Fallback: extrai x,y se set_data foi chamado
                data = getattr(action, '_data', {})
            raw = env.step(action, data=data if data else None)

        # Converte e guarda o frame
        try:
            frame = convert_raw_frame(raw)
            frames.append(frame)
        except Exception:
            continue

        # Verifica estado
        if frame.state == GameState.WIN:
            lvl = frame.levels_completed
            print(f"    ★ WIN! Níveis: {lvl} em {step + 1} passos")
            return lvl

        if step % 50 == 49:
            print(f"    ... passo {step + 1}/{max_actions}")

    print(f"    ⏰ Timeout {game_id} ({max_actions} passos)")
    return 0


def main():
    parser = argparse.ArgumentParser(description="AFASIA — PictoricAgent para ARC-AGI-3")
    parser.add_argument("--game", type=str, default=None, help="Game ID específico (ex: ls20)")
    parser.add_argument("--steps", type=int, default=200, help="Máximo de ações por jogo")
    args = parser.parse_args()

    print("=" * 60)
    print("  AFASIA — MOTOR PICTÓRICO v7.0 (Agent Class)")
    print("=" * 60)

    load_api_key()

    # Conecta com retry
    for attempt in range(3):
        try:
            arc = arc_agi.Arcade(operation_mode=arc_agi.OperationMode.COMPETITION)
            environments = arc.get_environments()
            print(f"✅ Conectado! {len(environments)} ambiente(s)")
            break
        except Exception as e:
            print(f"❌ Tentativa {attempt + 1}/3 falhou: {e}")
            if attempt < 2:
                time.sleep(5)
            else:
                sys.exit(1)

    # Filtra por jogo específico se pedido
    if args.game:
        environments = [e for e in environments if e.game_id == args.game]
        if not environments:
            print(f"⚠️  Jogo '{args.game}' não encontrado!")
            sys.exit(1)

    total = 0
    for env_info in environments:
        try:
            total += play_game(arc, env_info.game_id, max_actions=args.steps)
        except Exception as e:
            print(f"  ✗ Erro em {env_info.game_id}: {e}")

    print(f"\n🎯 SCORE FINAL: {total}")


if __name__ == "__main__":
    main()
