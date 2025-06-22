import Center from "../components/Center";
import Footer from "../components/Footer";
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
      <Footer />
    </>
  );
}

export default NotFoundPage;
