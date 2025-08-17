const btn = document.getElementById('go');
const statusEl = document.getElementById('status');

btn.onclick = async () => {
  statusEl.textContent = 'Working...';
  try {
    const res = await window.CleanerAPI.pickAndCleanMany();
    if (res.ok) {
      const list = res.outputs.map(p => `• ${p}`).join('\n');
      statusEl.textContent = `Done!\nSaved to:\n${list}`;
    } else {
      statusEl.textContent = `Error:\n${res.message || 'Unknown'}`;
    }
  } catch (e) {
    statusEl.textContent = `Error: ${String(e)}`;
  }
};
