const STORAGE_KEY = 'tt-playbook-pro';

function readInitial(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

let isPro = $state(readInitial());

export const proStatus = {
  get isPro() {
    return isPro;
  },
  set(value: boolean) {
    isPro = value;
    if (typeof localStorage !== 'undefined') {
      if (value) localStorage.setItem(STORAGE_KEY, '1');
      else localStorage.removeItem(STORAGE_KEY);
    }
  },
  toggle() {
    this.set(!isPro);
  },
};

export const FREE_EXERCISE_LIMIT = 5;
