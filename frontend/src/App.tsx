import AskQuestion from "./components/AskQuestion";

function App() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-8 h-screen flex flex-col">
      <h1 className="text-white text-center mb-6 text-4xl font-bold drop-shadow-lg">
        📰 Crypto News Agent 🤖
      </h1>
      <div className="flex-1 flex flex-col min-h-0">
        <AskQuestion />
      </div>
    </div>
  );
}

export default App;
