import Center from "../components/Center";
import Navbar from "../components/Navbar";

function NotFoundPage() {
  return (
    <>
      <Navbar />
      <Center>
        <h1>🪦 404 🪦</h1>
        <p>Web page not found...</p>
        <hr />
        <a href="/">
          <button className="outline">Return to Home</button>
        </a>
      </Center>
    </>
  );
}

export default NotFoundPage;
