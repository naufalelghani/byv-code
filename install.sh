#!/usr/bin/env bash
set -euo pipefail

# byv-code installer
# Usage: curl -fsSL https://raw.githubusercontent.com/naufalelghani/free-code/main/install.sh | bash

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

REPO="https://github.com/naufalelghani/free-code.git"
INSTALL_DIR="$HOME/byv-code"
BUN_MIN_VERSION="1.3.11"

info()  { printf "${CYAN}[*]${RESET} %s\n" "$*"; }
ok()    { printf "${GREEN}[+]${RESET} %s\n" "$*"; }
warn()  { printf "${YELLOW}[!]${RESET} %s\n" "$*"; }
fail()  { printf "${RED}[x]${RESET} %s\n" "$*"; exit 1; }

header() {
  echo ""
  printf "${BOLD}${CYAN}"
  cat << 'ART'
 _                                       _       
| |                                     | |      
| |__  _   _  __   _____  ___ ___   __| | ___  
| '_ \| | | | \ \ / /_____/ __/ _ \ / _` |/ _ \ 
|_.__/ \__, |  \ V /_____| (_| (_) | (_| |  __/ 
       |___/    \_/       \___\___/ \__,_|\___| 
ART
  printf "${RESET}"
  printf "${DIM} The free build of Claude Code${RESET}\n"
  echo ""
}

# -------------------------------------------------------------------
# System checks
# -------------------------------------------------------------------

check_os() {
  case "$(uname -s)" in
    Darwin) OS="macos" ;;
    Linux)  OS="linux" ;;
    MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
    *)      fail "Unsupported OS: $(uname -s). macOS, Linux, or Windows (Git Bash) required." ;;
  esac
  ok "OS: $(uname -s) $(uname -m)"
}

check_git() {
  if ! command -v git &>/dev/null; then
    fail "git is not installed. Install it first:
    macOS:  xcode-select --install
    Linux:  sudo apt install git  (or your distro's equivalent)"
  fi
  ok "git: $(git --version | head -1)"
}

# Compare semver: returns 0 if $1 >= $2
version_gte() {
  [ "$(printf '%s\n' "$1" "$2" | sort -V | head -1)" = "$2" ]
}

check_bun() {
  if command -v bun &>/dev/null; then
    local ver
    ver="$(bun --version 2>/dev/null || echo "0.0.0")"
    if version_gte "$ver" "$BUN_MIN_VERSION"; then
      ok "bun: v${ver}"
      return
    fi
    warn "bun v${ver} found but v${BUN_MIN_VERSION}+ required. Upgrading..."
  else
    info "bun not found. Installing..."
  fi
  install_bun
}

install_bun() {
  if [ "${OS:-}" = "windows" ]; then
    powershell.exe -Command "irm bun.sh/install.ps1 | iex"
  else
    curl -fsSL https://bun.sh/install | bash
  fi
  # Source the updated profile so bun is on PATH for this session
  export BUN_INSTALL="${BUN_INSTALL:-$HOME/.bun}"
  export PATH="$BUN_INSTALL/bin:$PATH"
  if ! command -v bun &>/dev/null; then
    fail "bun installation succeeded but binary not found on PATH.
    Add this to your shell profile (~/.bashrc) and restart:
      export PATH=\"\$HOME/.bun/bin:\$PATH\""
  fi
  ok "bun: v$(bun --version) (just installed)"
}

# -------------------------------------------------------------------
# Clone & build
# -------------------------------------------------------------------

clone_repo() {
  if [ -d "$INSTALL_DIR" ]; then
    warn "$INSTALL_DIR already exists"
    if [ -d "$INSTALL_DIR/.git" ]; then
      info "Pulling latest changes..."
      git -C "$INSTALL_DIR" pull --ff-only origin main 2>/dev/null || {
        warn "Pull failed, continuing with existing copy"
      }
    fi
  else
    info "Cloning repository..."
    git clone --depth 1 "$REPO" "$INSTALL_DIR"
  fi
  ok "Source: $INSTALL_DIR"
}

install_deps() {
  info "Installing dependencies..."
  cd "$INSTALL_DIR"
  bun install --frozen-lockfile 2>/dev/null || bun install
  ok "Dependencies installed"
}

build_binary() {
  info "Building byv-code (all experimental features enabled)..."
  cd "$INSTALL_DIR"
  bun run build:dev:full
  ok "Binary built: $INSTALL_DIR/cli-dev"
}

link_binary() {
  local link_dir="$HOME/.local/bin"
  mkdir -p "$link_dir"

  local src_bin="$INSTALL_DIR/cli-dev"
  if [ -f "$INSTALL_DIR/cli-dev.exe" ]; then
    src_bin="$INSTALL_DIR/cli-dev.exe"
  fi

  if [ "${OS:-}" = "windows" ]; then
    cp -f "$src_bin" "$link_dir/byv-code.exe" 2>/dev/null || ln -sf "$src_bin" "$link_dir/byv-code"
  else
    ln -sf "$src_bin" "$link_dir/byv-code"
  fi
  ok "Linked: $link_dir/byv-code"

  if ! echo "$PATH" | tr ':' '\n' | grep -qx "$link_dir"; then
    warn "$link_dir is not on your PATH"
    echo ""
    printf "${YELLOW}  Add this to your shell profile (~/.bashrc, ~/.bash_profile, etc.):${RESET}\n"
    printf "${BOLD}    export PATH=\"\$HOME/.local/bin:\$PATH\"${RESET}\n"
    echo ""
  fi
}

# -------------------------------------------------------------------
# Main
# -------------------------------------------------------------------

header
info "Starting installation..."
echo ""

check_os
check_git
check_bun
echo ""

clone_repo
install_deps
build_binary
link_binary

echo ""
printf "${GREEN}${BOLD}  Installation complete!${RESET}\n"
echo ""
printf "  ${BOLD}Run it:${RESET}\n"
printf "    ${CYAN}byv-code${RESET}                          # interactive REPL\n"
printf "    ${CYAN}byv-code -p \"your prompt\"${RESET}          # one-shot mode\n"
echo ""
printf "  ${BOLD}Set your API key:${RESET}\n"
printf "    ${CYAN}export ANTHROPIC_API_KEY=\"sk-ant-...\"${RESET}\n"
echo ""
printf "  ${BOLD}Or log in with Claude.ai:${RESET}\n"
printf "    ${CYAN}byv-code /login${RESET}\n"
echo ""
printf "  ${DIM}Source: $INSTALL_DIR${RESET}\n"
printf "  ${DIM}Binary: $INSTALL_DIR/cli-dev${RESET}\n"
printf "  ${DIM}Link:   ~/.local/bin/byv-code${RESET}\n"
echo ""
