"""
PictoricAgent — Motor Pictórico Fluid Wasserstein
Agente oficial ARC-AGI-3 compatível com o framework ARC-AGI-3-Agents.

Uso com o framework oficial:
  1. Copie este arquivo para agents/pictoric_agent.py
  2. Registre no agents/__init__.py
  3. Execute: uv run main.py --agent=pictoricagent --game=ls20

Uso standalone (neste repo):
  python main.py --game=ls20
"""

import math
import random
import time
from collections import defaultdict, deque
from typing import Any

from arcengine import FrameData, GameAction, GameState

# Tenta importar a classe base do framework oficial
# Se não estiver disponível, usa uma base mínima local
try:
    from agents.agent import Agent
except ImportError:
    try:
        from ..agent import Agent
    except (ImportError, ValueError):
        # Standalone: define uma base mínima compatível
        from abc import ABC, abstractmethod

        class Agent(ABC):  # type: ignore[no-redef]
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


# ========================= MATEMÁTICA PURA =========================
# Funções fora da classe para não poluir o self e manter testáveis.

def calc_geodesic_matrix(grid, src, tgt):
    """Calcula matriz de custo geodésico (BFS) entre pontos source → target."""
    R, C = len(grid), len(grid[0])
    dist_maps = []
    tgt_set = set(tgt)
    src_set = set(src)
    for t_node in tgt:
        dist = {t_node: 0}
        q = deque([t_node])
        while q:
            curr = q.popleft()
            d = dist[curr]
            for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nr, nc = curr[0] + dr, curr[1] + dc
                if 0 <= nr < R and 0 <= nc < C and (nr, nc) not in dist:
                    if grid[nr][nc] == 0 or (nr, nc) in tgt_set or (nr, nc) in src_set:
                        dist[(nr, nc)] = d + 1
                        q.append((nr, nc))
        dist_maps.append(dist)
    return [[dist_maps[j].get(s, 9999.0) for j in range(len(tgt))] for s in src]


def sinkhorn_solver(C, mu, nu, reg=0.5):
    """Solver Sinkhorn-Knopp para transporte ótimo regularizado."""
    n, m = len(mu), len(nu)
    if n == 0 or m == 0:
        return []
    K = [[math.exp(-C[i][j] / max(reg, 1e-10)) for j in range(m)] for i in range(n)]
    u, v = [1.0 / n] * n, [1.0 / m] * m
    for _ in range(30):
        for i in range(n):
            u[i] = mu[i] / max(sum(K[i][j] * v[j] for j in range(m)), 1e-10)
        for j in range(m):
            v[j] = nu[j] / max(sum(K[i][j] * u[i] for i in range(n)), 1e-10)
    return [[u[i] * K[i][j] * v[j] for j in range(m)] for i in range(n)]


def get_flow_vector(src, tgt, P):
    """Calcula vetor de fluxo médio ponderado pelo plano de transporte."""
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
    """Identifica os dois menores grupos de cores não-zero no grid."""
    colors = defaultdict(list)
    for r, row in enumerate(grid):
        for c, val in enumerate(row):
            v = int(val)
            if v != 0:
                colors[v].append((r, c))
    if len(colors) < 2:
        return [], []
    ranking = sorted(colors.keys(), key=lambda k: len(colors[k]))
    return colors[ranking[0]], colors[ranking[1]]


def extract_grid_from_frame(frame_data) -> list[list[int]]:
    """Extrai grid 2D de FrameData.frame.
    
    No framework oficial, FrameData.frame já é list[list[int]].
    Esta função lida com ambos os casos: framework e standalone.
    """
    if frame_data is None:
        return []

    # FrameData do framework: .frame já é list[list[int]]
    frame = getattr(frame_data, 'frame', None)
    if frame is None:
        return []

    # Descasca camadas (numpy arrays, listas aninhadas, etc)
    for _ in range(5):
        if hasattr(frame, 'tolist'):
            frame = frame.tolist()
            continue
        if isinstance(frame, list) and len(frame) > 0:
            first = frame[0]
            if hasattr(first, 'tolist'):
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


# ========================= AGENTE =========================

class PictoricAgent(Agent):
    """Motor Pictórico: agente ARC-AGI-3 baseado em Transporte Ótimo (Sinkhorn).
    
    Lógica de decisão:
      1. Se NOT_PLAYED ou GAME_OVER → RESET
      2. Detecção anti-loop (3 frames idênticos → ação aleatória)
      3. Prioridade: WASD/Sinkhorn > Click exploratório > Random
    """

    MAX_ACTIONS = 200  # Mais headroom que o default de 80

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        seed = int(time.time() * 1000000) + hash(self.game_id) % 1000000
        random.seed(seed)
        self._stale_count = 0
        self._stale_threshold = 5
        self._last_actions = deque(maxlen=10)
        self._direction_history = deque(maxlen=6)
        self._visited_positions = set()

    @property
    def name(self) -> str:
        return f"{self.game_id}.pictoricagent"

    # ---- Interface obrigatória ----

    def is_done(self, frames: list[FrameData], latest_frame: FrameData) -> bool:
        """Decide se o agente terminou de jogar."""
        return latest_frame.state is GameState.WIN

    def choose_action(
        self, frames: list[FrameData], latest_frame: FrameData
    ) -> GameAction:
        """Escolhe a próxima ação. Chamado pelo loop principal do framework.
        
        Retorna um único GameAction (com .set_data() se complexo).
        """
        # --- RESET se necessário ---
        if latest_frame.state in [GameState.NOT_PLAYED, GameState.GAME_OVER]:
            self._stale_count = 0
            action = GameAction.RESET
            action.reasoning = "Resetting: game not started or game over"
            return action

        # --- Extrair grid ---
        grid = extract_grid_from_frame(latest_frame)

        # --- Detecção anti-loop ---
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

        # --- Detectar oscilação ABAB nas últimas 4 ações ---
        if len(self._last_actions) >= 4:
            last_4 = list(self._last_actions)[-4:]
            is_oscillating = (last_4[0] == last_4[2] and last_4[1] == last_4[3]
                              and last_4[0] != last_4[1])
            if is_oscillating:
                self._stale_count += 2

        # --- Obter ações disponíveis (excluindo RESET) ---
        available = [a for a in GameAction if a is not GameAction.RESET]
        if not available:
            return GameAction.RESET

        # --- Forçar aleatório (anti-loop) ou grid vazio ---
        if force_random or not grid:
            action = random.choice(available)
            if action.is_complex():
                action.set_data({"x": random.randint(0, 63), "y": random.randint(0, 63)})
                action.reasoning = "Anti-loop: random action to unstick"
            else:
                action.reasoning = "Anti-loop: random WASD to break stale state"
            return action

        # --- Análise de blobs ---
        src, tgt = find_blobs(grid)

        if not src or not tgt:
            action = random.choice(available)
            if action.is_complex():
                action.set_data({"x": random.randint(0, 63), "y": random.randint(0, 63)})
                action.reasoning = "No blobs detected: random action"
            else:
                action.reasoning = "No blobs detected: random WASD"
            return action

        # --- Separar ações por tipo ---
        complex_actions = [a for a in available if a.is_complex()]
        simple_actions = [a for a in available if a.is_simple()]
        action_map = {}
        for a in simple_actions:
            action_map[a.value] = a
            action_map[a.name] = a  # fallback por nome

        # ============ PRIORIDADE 1: WASD (Sinkhorn) ============
        n_src, n_tgt = len(src), len(tgt)
        if len(action_map) > 0 and n_src * n_tgt <= 5000:
            C = calc_geodesic_matrix(grid, src, tgt)
            P = sinkhorn_solver(C, [1.0 / n_src] * n_src, [1.0 / n_tgt] * n_tgt)
            dr, dc = get_flow_vector(src, tgt, P)

            if abs(dr) > 0.01 or abs(dc) > 0.01:
                if abs(dr) > abs(dc):
                    act = action_map.get(2 if dr > 0 else 1)  # DOWN ou UP
                else:
                    act = action_map.get(4 if dc > 0 else 3)  # RIGHT ou LEFT
                if act:
                    act.reasoning = f"Sinkhorn flow: dr={dr:.3f}, dc={dc:.3f}"
                    return act

        # ============ PRIORIDADE 2: CLICK exploratório ============
        if complex_actions:
            point = random.choice(tgt)
            pr = max(0, min(63, point[0]))
            pc = max(0, min(63, point[1]))
            action = complex_actions[0]
            action.set_data({"x": pc, "y": pr})
            action.reasoning = f"Click on target pixel ({pr},{pc}) from {len(tgt)} candidates"
            return action

        # ============ FALLBACK: random ============
        action = random.choice(available)
        if action.is_complex():
            action.set_data({"x": random.randint(0, 63), "y": random.randint(0, 63)})
        action.reasoning = "Fallback: random action"
        return action
