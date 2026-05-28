import { useEffect, useState } from 'react';
import { fetchLinks } from './api';
import LinkTable from './components/LinkTable';
import AddLinkModal from './components/AddLinkModal';
import QRDisplay from './components/QRDisplay';
import ClickStats from './components/ClickStats';
import './App.css';

export default function App() {
  const [links, setLinks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchLinks().then(setLinks);
  }, []);

  const handleCreated = (link) => {
    setLinks(l => [link, ...l]);
    setSelected(link);
  };

  const handleUpdate = (link) => {
    setLinks(l => l.map(x => x.id === link.id ? link : x));
    setSelected(s => s?.id === link.id ? link : s);
  };

  return (
    <div className="layout">
      <header>
        <h1>pozovi.tours — QR Admin</h1>
      </header>
      <main>
        <div className="col-left">
          <LinkTable
            links={links}
            selected={selected}
            onSelect={setSelected}
            onAdd={() => setShowModal(true)}
            onUpdate={handleUpdate}
          />
        </div>
        <div className="col-center">
          <QRDisplay link={selected} />
        </div>
        <div className="col-right">
          <ClickStats link={selected} />
        </div>
      </main>
      {showModal && (
        <AddLinkModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
