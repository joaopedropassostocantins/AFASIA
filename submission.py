"""
AFASIA — submission.py para Kaggle Offline
Motor Pictórico v7.3 (Sinkhorn-Knopp + BFS Geodésico)

Estrutura:
  Seção 0  — Instalação dos wheels locais (sem internet)
  Seção 1  — Imports e configuração
  Seção 2  — Matemática (BFS + Sinkhorn)
  Seção 3  — PictoricAgent
  Seção 4  — Loop principal (OperationMode.OFFLINE)

Uso local para testar:
  python submission.py
"""

# ===========================================================
# SEÇÃO 0 — INSTALAÇÃO (estabilizada v7.3, NÃO MODIFICAR)
# ===========================================================
import sys
import subprocess
import glob as _glob
import os

def _install_wheels() -> None:
    """Instala arcengine e arc_agi a partir dos wheels em /kaggle/input/."""
    KAGGLE_INPUT = "/kaggle/input"

    # Mapa: nome do pacote → padrões de busca nos subdiretórios
    wheel_patterns = {
        "arcengine": [
            f"{KAGGLE_INPUT}/**/arcengine*.whl",
            f"{KAGGLE_INPUT}/**/arcengine-*.whl",
        ],
        "arc_agi": [
            f"{KAGGLE_INPUT}/**/arc_agi*.whl",
            f"{KAGGLE_INPUT}/**/arc-agi*.whl",
        ],
    }

    for pkg, patterns in wheel_patterns.items():
        # Verifica se já está instalado
        try:
            __import__(pkg)
            print(f"[OK] {pkg} já instalado")
            continue
        except ImportError:
            pass

        # Procura o wheel
        wheel_path = None
        for pattern in patterns:
            matches = _glob.glob(pattern, recursive=True)
            if matches:
                wheel_path = sorted(matches)[-1]  # versão mais recente
                break

        if wheel_path is None:
            print(f"[ERRO] Wheel não encontrado para {pkg}")
            print(f"       Padrões buscados: {patterns}")
            print(f"       Conteúdo de {KAGGLE_INPUT}:")
            for root, dirs, files in os.walk(KAGGLE_INPUT):
                for f in files:
                    if f.endswith(".whl"):
                        print(f"         {os.path.join(root, f)}")
            sys.exit(1)

        print(f"[INFO] Instalando {pkg} de: {wheel_path}")
        result = subprocess.run(
            [sys.executable, "-m", "pip", "install", wheel_path,
             "--no-deps", "--quiet"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"[ERRO] Falha ao instalar {pkg}:\n{result.stderr}")
            sys.exit(1)
        print(f"[OK] {pkg} instalado com sucesso")


_install_wheels()

# ===========================================================
# SEÇÃO 1 — IMPORTS E CONFIGURAÇÃO
# ===========================================================
import math
import random
import time
import logging
from abc import ABC, abstractmethod
from collections import defaultdict, deque
from typing import Any

from arcengine import FrameData, FrameDataRaw, GameAction, GameState
import arc_agi

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger("afasia")

MAX_STEPS_PER_GAME = 200


def _load_api_key() -> str:
    """Carrega ARC_API_KEY via Kaggle Secrets ou variável de ambiente."""
    try:
        from kaggle_secrets import UserSecretsClient
        key = UserSecretsClient().get_secret("ARC_API_KEY")
        if key:
            os.environ["ARC_API_KEY"] = key
            logger.info("API Key carregada via Kaggle Secrets")
            return key
    except Exception:
        pass

    key = os.environ.get("ARC_API_KEY", "").strip()
    if key:
        logger.info("API Key carregada via variável de ambiente")
        return key

    print("=" * 60)
    print("ERRO CRITICO: ARC_API_KEY NAO ENCONTRADA!")
    print("  -> No Kaggle: Add-ons > Secrets > ARC_API_KEY")
    print("  -> Local:     export ARC_API_KEY='sua-chave'")
    print("=" * 60)
    sys.exit(1)


# ===========================================================
# SEÇÃO 2 — MATEMÁTICA PURA (BFS + SINKHORN)
# ===========================================================

def calc_geodesic_matrix(grid, src, tgt):
    """Matriz de custo geodésico via BFS, respeitando obstáculos."""
    R, C = len(grid), len(grid[0])
    tgt_set = set(tgt)
    dist_maps = []
    for t_node in tgt:
        dist = {t_node: 0}
        q = deque([t_node])
        while q:
            curr = q.popleft()
            d = dist[curr]
            for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nr, nc = curr[0] + dr, curr[1] + dc
                if 0 <= nr < R and 0 <= nc < C and (nr, nc) not in dist:
                    if grid[nr][nc] == 0 or (nr, nc) in tgt_set:
                        dist[(nr, nc)] = d + 1
                        q.append((nr, nc))
        dist_maps.append(dist)
    return [[dist_maps[j].get(s, 9999.0) for j in range(len(tgt))] for s in src]


def sinkhorn_solver(C, mu, nu, reg=0.5):
    """Sinkhorn-Knopp: transporte ótimo regularizado (30 iterações)."""
    n, m = len(mu), len(nu)
    if n == 0 or m == 0:
        return []
    K = [[math.exp(-C[i][j] / max(reg, 1e-10)) for j in range(m)] for i in range(n)]
    u = [1.0 / n] * n
    v = [1.0 / m] * m
    for _ in range(30):
        for i in range(n):
            u[i] = mu[i] / max(sum(K[i][j] * v[j] for j in range(m)), 1e-10)
        for j in range(m):
            v[j] = nu[j] / max(sum(K[i][j] * u[i] for i in range(n)), 1e-10)
    return [[u[i] * K[i][j] * v[j] for j in range(m)] for i in range(n)]


def get_flow_vector(src, tgt, P):
    """Vetor de fluxo médio ponderado pelo plano de transporte."""
    tdr = tdc = tmass = 0.0
    for i, s in enumerate(src):
        dr = dc = mi = 0.0
        for j in range(len(tgt)):
            dr += P[i][j] * tgt[j][0]
            dc += P[i][j] * tgt[j][1]
            mi += P[i][j]
        if mi > 1e-10:
            tdr += ((dr / mi) - s[0]) * mi
            tdc += ((dc / mi) - s[1]) * mi
            tmass += mi
    return (tdr / tmass, tdc / tmass) if tmass > 1e-10 else (0.0, 0.0)


def find_blobs(grid):
    """Dois menores grupos de cores não-zero no grid."""
    colors: dict = defaultdict(list)
    for r, row in enumerate(grid):
        for c, val in enumerate(row):
            v = int(val)
            if v != 0:
                colors[v].append((r, c))
    if len(colors) < 2:
        return [], []
    ranking = sorted(colors.keys(), key=lambda k: len(colors[k]))
    return colors[ranking[0]], colors[ranking[1]]


def extract_grid_from_frame(frame_data) -> list:
    """Extrai grid 2D de FrameData."""
    if frame_data is None:
        return []
    frame = getattr(frame_data, "frame", None)
    if frame is None:
        return []
    for _ in range(5):
        if hasattr(frame, "tolist"):
            frame = frame.tolist()
            continue
        if isinstance(frame, list) and len(frame) > 0:
            first = frame[0]
            if hasattr(first, "tolist"):
                frame = first.tolist()
                continue
            if isinstance(first, list) and len(first) > 0 and isinstance(first[0], list):
                frame = first
                continue
        break
    if isinstance(frame, list) and len(frame) > 0 and isinstance(frame[0], list):
        try:
            return [[int(cell) for cell in row] for row in frame]
        except (TypeError, ValueError):
            pass
    return []


# ===========================================================
# SEÇÃO 3 — PICTORICAGENT
# ===========================================================

class Agent(ABC):
    """Base mínima compatível com o framework ARC-AGI-3-Agents."""
    MAX_ACTIONS: int = 80
    game_id: str = ""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.game_id = kwargs.get("game_id", "")

    @abstractmethod
    def is_done(self, frames: list, latest_frame: Any) -> bool:
        raise NotImplementedError

    @abstractmethod
    def choose_action(self, frames: list, latest_frame: Any) -> GameAction:
        raise NotImplementedError


class PictoricAgent(Agent):
    """Motor Pictórico: agente ARC-AGI-3 baseado em Transporte Ótimo."""

    MAX_ACTIONS = 200

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        seed = int(time.time() * 1_000_000) + hash(self.game_id) % 1_000_000
        random.seed(seed)
        self._stale_count = 0
        self._stale_threshold = 3

    @property
    def name(self) -> str:
        return f"{self.game_id}.pictoricagent"

    def is_done(self, frames: list, latest_frame: FrameData) -> bool:
        return latest_frame.state is GameState.WIN

    def choose_action(self, frames: list, latest_frame: FrameData) -> GameAction:
        # --- RESET se necessário ---
        if latest_frame.state in (GameState.NOT_PLAYED, GameState.GAME_OVER):
            self._stale_count = 0
            action = GameAction.RESET
            action.reasoning = "Resetting: game not started or game over"
            return action

        grid = extract_grid_from_frame(latest_frame)

        # --- Anti-loop ---
        force_random = False
        if len(frames) >= 2:
            prev_grid = extract_grid_from_frame(frames[-1])
            if grid and prev_grid and grid == prev_grid:
                self._stale_count += 1
                if self._stale_count >= self._stale_threshold:
                    force_random = True
                    self._stale_count = 0
            else:
                self._stale_count = 0

        available = [a for a in GameAction if a is not GameAction.RESET]
        if not available:
            return GameAction.RESET

        if force_random or not grid:
            action = random.choice(available)
            if action.is_complex():
                action.set_data({"x": random.randint(0, 63), "y": random.randint(0, 63)})
                action.reasoning = "Anti-loop: random complex"
            else:
                action.reasoning = "Anti-loop: random WASD"
            return action

        src, tgt = find_blobs(grid)

        if not src or not tgt:
            action = random.choice(available)
            if action.is_complex():
                action.set_data({"x": random.randint(0, 63), "y": random.randint(0, 63)})
                action.reasoning = "No blobs: random complex"
            else:
                action.reasoning = "No blobs: random WASD"
            return action

        complex_actions = [a for a in available if a.is_complex()]
        simple_actions  = [a for a in available if a.is_simple()]
        action_map = {a.value: a for a in simple_actions}

        # PRIORIDADE 1: WASD via Sinkhorn
        n_src, n_tgt = len(src), len(tgt)
        if action_map and n_src * n_tgt <= 5000:
            C = calc_geodesic_matrix(grid, src, tgt)
            P = sinkhorn_solver(C, [1.0 / n_src] * n_src, [1.0 / n_tgt] * n_tgt)
            dr, dc = get_flow_vector(src, tgt, P)
            if abs(dr) > 0.01 or abs(dc) > 0.01:
                if abs(dr) > abs(dc):
                    act = action_map.get(2 if dr > 0 else 1)  # DOWN / UP
                else:
                    act = action_map.get(4 if dc > 0 else 3)  # RIGHT / LEFT
                if act:
                    act.reasoning = f"Sinkhorn flow: dr={dr:.3f} dc={dc:.3f}"
                    return act

        # PRIORIDADE 2: CLICK exploratório
        if complex_actions:
            point = random.choice(tgt)
            pr = max(0, min(63, point[0]))
            pc = max(0, min(63, point[1]))
            action = complex_actions[0]
            action.set_data({"x": pc, "y": pr})
            action.reasoning = f"Click ({pr},{pc})"
            return action

        # FALLBACK: random
        action = random.choice(available)
        if action.is_complex():
            action.set_data({"x": random.randint(0, 63), "y": random.randint(0, 63)})
        action.reasoning = "Fallback: random"
        return action


# ===========================================================
# SEÇÃO 4 — LOOP PRINCIPAL (OFFLINE)
# ===========================================================

def convert_raw_frame(raw) -> FrameData:
    """Converte FrameDataRaw -> FrameData."""
    if raw is None:
        raise ValueError("Frame None recebido")
    return FrameData(
        game_id=raw.game_id,
        frame=[arr.tolist() if hasattr(arr, "tolist") else arr for arr in raw.frame],
        state=raw.state,
        levels_completed=raw.levels_completed,
        win_levels=raw.win_levels,
        guid=raw.guid,
        full_reset=raw.full_reset,
        available_actions=raw.available_actions,
    )


def play_game(arc, game_id: str, max_actions: int = MAX_STEPS_PER_GAME) -> int:
    env = arc.make(game_id)
    if env is None:
        logger.warning("Falha ao criar ambiente %s", game_id)
        return 0

    agent = PictoricAgent(
        card_id="kaggle-offline",
        game_id=game_id,
        agent_name="pictoricagent",
        ROOT_URL="",
        record=False,
        arc_env=env,
    )
    agent.MAX_ACTIONS = max_actions

    frames: list[FrameData] = [FrameData(levels_completed=0)]
    logger.info("Iniciando %s", game_id)

    for step in range(max_actions):
        raw_obs = env.observation_space
        try:
            latest_frame = convert_raw_frame(raw_obs)
        except Exception:
            latest_frame = frames[-1]

        action = agent.choose_action(frames, latest_frame)

        if action == GameAction.RESET:
            raw = env.reset()
        else:
            data = {}
            if hasattr(action, "action_data") and action.action_data:
                data = action.action_data.model_dump()
            elif action.is_complex():
                data = getattr(action, "_data", {})
            raw = env.step(action, data=data if data else None)

        try:
            frame = convert_raw_frame(raw)
            frames.append(frame)
        except Exception:
            continue

        if frame.state == GameState.WIN:
            lvl = frame.levels_completed
            logger.info("WIN %s | niveis=%d | passos=%d", game_id, lvl, step + 1)
            return lvl

        if step % 50 == 49:
            logger.info("%s | passo %d/%d", game_id, step + 1, max_actions)

    logger.info("TIMEOUT %s (%d passos)", game_id, max_actions)
    return 0


def main() -> None:
    print("=" * 60)
    print("  AFASIA -- MOTOR PICTORICO v7.3 (Kaggle Offline)")
    print("=" * 60)

    _load_api_key()

    # Conecta no modo OFFLINE (sem internet)
    for attempt in range(1, 4):
        try:
            arc = arc_agi.Arcade(operation_mode=arc_agi.OperationMode.OFFLINE)
            environments = arc.get_environments()
            logger.info("Conectado! %d ambiente(s) disponiveis", len(environments))
            break
        except Exception as exc:
            logger.warning("Tentativa %d/3 falhou: %s", attempt, exc)
            if attempt < 3:
                time.sleep(2 ** attempt)  # backoff: 2s, 4s
            else:
                logger.error("Nao foi possivel conectar ao ARC-AGI.")
                sys.exit(1)

    total = 0
    for env_info in environments:
        try:
            total += play_game(arc, env_info.game_id)
        except Exception as exc:
            logger.error("Erro em %s: %s", env_info.game_id, exc)

    print("=" * 60)
    print(f"  SCORE FINAL: {total} levels_completed")
    print("=" * 60)


if __name__ == "__main__":
    main()
