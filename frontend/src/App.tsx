import { useEffect, useRef } from 'react';
import { LabScene } from './scene/LabScene';
import { TopBar } from './hud/TopBar';
import { ExcuseConsole } from './hud/ExcuseConsole';
import { InspectorDrawer } from './hud/InspectorDrawer';
import { NavDock } from './hud/NavDock';
import { BadIdeasModal, GraveyardModal } from './hud/Modals';
import { PanicOverlay } from './hud/PanicOverlay';
import { useLabStore } from './store/labStore';

/** brief white-violet flash across the HUD when a MOSFET gives its life */
function BoomFlash() {
  const flashNonce = useLabStore((s) => s.flashNonce);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!flashNonce || !ref.current) return;
    const el = ref.current;
    el.style.transition = 'none';
    el.style.opacity = '0.55';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.6s ease-out';
      el.style.opacity = '0';
    });
  }, [flashNonce]);
  return <div ref={ref} className="pointer-events-none fixed inset-0 z-[70] bg-[#c9a8ff] opacity-0" />;
}

export default function App() {
  const init = useLabStore((s) => s.init);
  const sagging = useLabStore((s) => s.stats?.voltageSagging ?? false);

  useEffect(() => init(), [init]);

  return (
    <div className={`crt relative h-full w-full ${sagging ? 'voltage-sag' : ''}`}>
      <LabScene />
      <TopBar />
      <ExcuseConsole />
      <InspectorDrawer />
      <NavDock />
      <GraveyardModal />
      <BadIdeasModal />
      <BoomFlash />
      <PanicOverlay />
    </div>
  );
}
