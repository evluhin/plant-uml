import ForgeUI_ from '@forge/react';
import { invoke } from '@forge/bridge';
const ForgeUI: any = ForgeUI_;

const App = () => {
    const [source, setSource]   = ForgeUI.useState('@startuml\nAlice -> Bob: Hello\n@enduml');
    const [loading, setLoading] = ForgeUI.useState(false);
    const [result, setResult]   = ForgeUI.useState('');
    const [error, setError]     = ForgeUI.useState('');

    const onRender = async () => {
        if (!source.trim()) return;
        setLoading(true); setError('');
        try {
            const resp: any = await invoke('plantuml-resolver', { payload: { source, format: 'svg' } });
            if (resp?.error) { setError(String(resp.error)); setResult(''); }
            else { setResult(String(resp?.html ?? '')); }
        } catch (e: any) { setError(e?.message || 'Rendering failed'); setResult(''); }
        finally { setLoading(false); }
    };

    return (
        <ForgeUI.Fragment>
            <ForgeUI.Text>Source Code</ForgeUI.Text>
            <ForgeUI.TextArea value={source} onChange={setSource} placeholder="Enter PlantUML source…" />
            <ForgeUI.Button onClick={onRender} isDisabled={loading || !source.trim()}>
                {loading ? 'Rendering…' : 'Render'}
            </ForgeUI.Button>

            {loading && <ForgeUI.Text>Rendering…</ForgeUI.Text>}
            {error && <ForgeUI.Text>Error: {error}</ForgeUI.Text>}
            {!loading && !error && result && <div dangerouslySetInnerHTML={{ __html: result }} />}
            {!loading && !error && !result && <ForgeUI.Text>Preview will appear here</ForgeUI.Text>}
        </ForgeUI.Fragment>
    );
};

export const run = ForgeUI.render(
    <ForgeUI.Macro>
        <App />
    </ForgeUI.Macro>
);