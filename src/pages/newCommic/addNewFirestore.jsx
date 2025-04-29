import React, { useState, useEffect } from "react";
import { setDoc, doc } from "firebase/firestore";
import { db } from "../../firebase";
import { useLocation, useNavigate } from "react-router-dom";

const AddNewComicsFirestore = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { comicName, coverImageURL, heroImageURL } = location.state || {};
    const [author, setAuthor] = useState("");
    const [coverImageUrl, setCoverImageUrl] = useState("");
    const [heroImageUrl, setHeroImageUrl] = useState("");
    const [title, setTitle] = useState("");
    const [genres, setGenres] = useState([]);
    const [genreInput, setGenreInput] = useState("");

    const [isHero, setIsHero] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [isRecommended, setIsRecommended] = useState(false);

    useEffect(() => {
        if (!coverImageURL || !heroImageURL) {
            alert("No image URLs provided. Please upload images first.");
            navigate("/add-new-comics");
            return;
        }

        setCoverImageUrl(coverImageURL);
        setHeroImageUrl(heroImageURL);
        if (comicName) {
            setTitle(comicName);
        }
    }, [coverImageURL, heroImageURL, comicName, navigate]);

    const handleAddGenre = () => {
        if (genreInput.trim()) {
            setGenres((prev) => [...prev, genreInput.trim()]);
            setGenreInput("");
        }
    };

    const handleRemoveGenre = (genre) => {
        setGenres((prev) => prev.filter((g) => g !== genre));
    };

    const handleSubmit = async () => {
        if (!title || !author || !coverImageUrl || !heroImageUrl || genres.length === 0) {
            alert("Please fill all fields and add at least one genre.");
            return;
        }

        const data = {
            author,
            coverImage: coverImageUrl,
            genre: genres,
            heroLandscapeImage: heroImageUrl,
            isHero,
            isNew,
            isRecommended,
            title,
            type: "comic",
        };

        try {
            // Ensure comicName is valid and unique in Firestore.
            if (comicName) {
                await setDoc(doc(db, "comics", comicName), data);
                alert("📚 Comic metadata added to Firestore!");
                navigate("/");
            } else {
                alert("Comic name is missing. Please check your input.");
            }
        } catch (error) {
            console.error("Error adding document:", error);
            alert("❌ Failed to upload comic metadata.");
        }
    };

    return (
        <div style={{
            padding: "2rem",
            fontFamily: "sans-serif",
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#1e1e1e",
            color: "white",
            borderRadius: "10px",
            boxShadow: "0 0 15px rgba(255,255,255,0.1)"
        }}>
            <h1 style={{ textAlign: "center", marginBottom: "2rem", color: "#fff" }}>📝 Add Comic Metadata</h1>

            <div style={{ marginBottom: "2rem" }}>
                <h3>Preview Images:</h3>
                {coverImageUrl && (
                    <div style={{ marginBottom: "1rem" }}>
                        <p>Cover Image:</p>
                        <img src={coverImageUrl} alt="Cover" style={{ maxWidth: "200px", height: "auto", borderRadius: "8px" }} />
                    </div>
                )}
                {heroImageUrl && (
                    <div style={{ marginBottom: "1rem" }}>
                        <p>Hero Image:</p>
                        <img src={heroImageUrl} alt="Hero" style={{ maxWidth: "300px", height: "auto", borderRadius: "8px" }} />
                    </div>
                )}
            </div>

            <label>📚 Title:</label>
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter comic title"
                style={{
                    width: "100%",
                    marginBottom: "1rem",
                    padding: "0.5rem",
                    backgroundColor: "#2e2e2e",
                    color: "white",
                    border: "1px solid #555",
                    borderRadius: "5px"
                }}
            />

            <label>✍️ Author:</label>
            <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                style={{
                    width: "100%",
                    marginBottom: "1rem",
                    padding: "0.5rem",
                    backgroundColor: "#2e2e2e",
                    color: "white",
                    border: "1px solid #555",
                    borderRadius: "5px"
                }}
            />

            <label>🏷️ Genre:</label>
            <div style={{ display: "flex", marginBottom: "1rem" }}>
                <input
                    type="text"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    placeholder="Add genre"
                    style={{
                        flex: 1,
                        padding: "0.5rem",
                        backgroundColor: "#2e2e2e",
                        color: "white",
                        border: "1px solid #555",
                        borderRadius: "5px"
                    }}
                />
                <button
                    onClick={handleAddGenre}
                    style={{
                        marginLeft: "0.5rem",
                        padding: "0.5rem 1rem",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}
                >
                    Add
                </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
                {genres.map((genre, idx) => (
                    <span key={idx} style={{
                        display: "inline-block",
                        padding: "0.3rem 0.6rem",
                        backgroundColor: "#333",
                        marginRight: "0.5rem",
                        borderRadius: "4px",
                        marginBottom: "0.3rem"
                    }}>
                        {genre} <button
                            onClick={() => handleRemoveGenre(genre)}
                            style={{
                                marginLeft: "0.3rem",
                                backgroundColor: "transparent",
                                color: "red",
                                border: "none",
                                cursor: "pointer"
                            }}
                        >
                            x
                        </button>
                    </span>
                ))}
            </div>

            <div style={{ marginBottom: "1rem" }}>
                <label>
                    <input type="checkbox" checked={isHero} onChange={() => setIsHero(!isHero)} /> 🔥 Is Hero
                </label><br />
                <label>
                    <input type="checkbox" checked={isNew} onChange={() => setIsNew(!isNew)} /> 🆕 Is New
                </label><br />
                <label>
                    <input type="checkbox" checked={isRecommended} onChange={() => setIsRecommended(!isRecommended)} /> ⭐ Is Recommended
                </label>
            </div>

            <button
                onClick={handleSubmit}
                style={{
                    backgroundColor: "#2196F3",
                    color: "white",
                    padding: "0.75rem 2rem",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    cursor: "pointer",
                    display: "block",
                    margin: "0 auto"
                }}
            >
                📤 Submit Metadata
            </button>
        </div>
    );
};

export default AddNewComicsFirestore;
