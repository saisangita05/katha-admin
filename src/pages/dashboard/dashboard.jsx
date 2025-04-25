import React, { useEffect, useState } from "react";
import { listAll, ref, getDownloadURL } from "firebase/storage";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db, storage } from "../../firebase";
import "./dashboard.css";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const navigate = useNavigate();
    const [comicCount, setComicCount] = useState(0);
    const [webnovelCount, setWebnovelCount] = useState(0);
    const [comicsData, setComicsData] = useState([]);
    const [expandedComic, setExpandedComic] = useState(null);
    const [expandedEpisode, setExpandedEpisode] = useState(null);
    const [episodeTitle, setEpisodeTitle] = useState("");
    const [selectedComicId, setSelectedComicId] = useState(null);
    const [isCreatingEpisode, setIsCreatingEpisode] = useState(false);

    const findDocFilesRecursively = async (folderRef) => {
        const result = await listAll(folderRef);
        const docFound = result.items.some(item =>
            item.name.endsWith(".doc") || item.name.endsWith(".docx")
        );
        if (docFound) return true;

        for (const subFolder of result.prefixes) {
            const found = await findDocFilesRecursively(subFolder);
            if (found) return true;
        }
        return false;
    };

    const fetchEpisodeImages = async (comicName, episodeNumber) => {
        try {
            const episodePath = `${comicName}/Episode ${String(episodeNumber).padStart(2, "0")}`;
            const episodeRef = ref(storage, episodePath);
            const result = await listAll(episodeRef);
            
            const urls = await Promise.all(
                result.items.map(async (item) => {
                    const url = await getDownloadURL(item);
                    return url;
                })
            );
            
            return urls.sort(); // Sort URLs to ensure consistent order
        } catch (error) {
            console.error("Error fetching episode images:", error);
            return [];
        }
    };

    const handleCreateEpisode = async (comicId, comicName) => {
        setSelectedComicId(comicId);
        setIsCreatingEpisode(true);
        setEpisodeTitle("");
    };

    const handleSubmitEpisode = async () => {
        if (!episodeTitle || !selectedComicId) {
            alert("Please enter an episode title");
            return;
        }

        try {
            const comic = comicsData.find(c => c.id === selectedComicId);
            if (!comic) return;

            // Get the next episode number
            const episodeNumber = comic.episodes ? comic.episodes.length + 1 : 1;
            
            // Fetch images from storage for this episode
            const images = await fetchEpisodeImages(comic.title, episodeNumber);
            
            if (images.length === 0) {
                alert("No images found for this episode in storage");
                return;
            }

            // Create episode document with padded number format (episode01, episode02, etc.)
            const paddedNumber = String(episodeNumber).padStart(2, '0');
            const episodeRef = doc(db, `comics/${selectedComicId}/episodes`, `episode${paddedNumber}`);
            await setDoc(episodeRef, {
                number: episodeNumber,
                title: episodeTitle,
                previewImage: images[0],
                images: images
            });

            // Refresh comics data
            fetchComics();
            
            // Reset states
            setIsCreatingEpisode(false);
            setEpisodeTitle("");
            setSelectedComicId(null);
            
            alert("Episode created successfully!");
        } catch (error) {
            console.error("Error creating episode:", error);
            alert("Failed to create episode");
        }
    };

    useEffect(() => {
        const fetchCounts = async () => {
            const rootRef = ref(storage);
            const result = await listAll(rootRef);
            let comics = 0, webnovels = 0;

            for (const folder of result.prefixes) {
                const hasDocFile = await findDocFilesRecursively(folder);
                hasDocFile ? webnovels++ : comics++;
            }

            setComicCount(comics);
            setWebnovelCount(webnovels);
        };

        fetchComics();
        fetchCounts();
    }, []);

    const fetchComics = async () => {
        try {
            const snapshot = await getDocs(collection(db, "comics"));
            const list = [];

            for (const docSnap of snapshot.docs) {
                const comic = {
                    id: docSnap.id,
                    ...docSnap.data(),
                    episodes: []
                };
                const epsSnap = await getDocs(collection(db, `comics/${docSnap.id}/episodes`));
                comic.episodes = epsSnap.docs.map(ep => ({ id: ep.id, ...ep.data() }));
                list.push(comic);
            }

            setComicsData(list);
        } catch (err) {
            console.error("Error fetching comics:", err);
        }
    };

    const toggleComic = (id) => {
        setExpandedComic(expandedComic === id ? null : id);
        setExpandedEpisode(null);
    };

    const toggleEpisode = (id) => {
        setExpandedEpisode(expandedEpisode === id ? null : id);
    };

    return (
        <div className="container">
            <div className="header">
                <h2>📚 Dashboard</h2>
                <button className="add-comic-btn" onClick={() => navigate("/add-new-comics")}>
                    ➕ Add New Comic
                </button>
            </div>

            <div className="stats-container">
                <div className="stat-card">
                    <h3>Total Comics</h3>
                    <p>{comicCount}</p>
                </div>
                <div className="stat-card">
                    <h3>Total Webnovels</h3>
                    <p>{webnovelCount}</p>
                </div>
            </div>

            <div className="firestore-view">
                <h3>Firestore Comics & Episodes</h3>
                {comicsData.map((comic) => (
                    <div key={comic.id} className="accordion">
                        <div className="accordion-header" onClick={() => toggleComic(comic.id)}>
                            <strong>📘 Comic:</strong> {comic.title || comic.id}
                        </div>
                        {expandedComic === comic.id && (
                            <div className="accordion-body">
                                <div className="comic-details">
                                    <img src={comic.coverImage} alt="Cover" className="comic-cover" />
                                    <div className="comic-info">
                                        <p><strong>Author:</strong> {comic.author}</p>
                                        <p><strong>Genres:</strong> {comic.genre.join(", ")}</p>
                                        <button 
                                            className="create-episode-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCreateEpisode(comic.id, comic.title);
                                            }}
                                        >
                                            ➕ Create Episode
                                        </button>
                                    </div>
                                </div>

                                <div className="hero-image-container">
                                    <h4>Banner Image:</h4>
                                    <img src={comic.heroLandScapeImage} alt="Banner" className="hero-image" />
                                </div>
                                
                                {isCreatingEpisode && selectedComicId === comic.id && (
                                    <div className="create-episode-form">
                                        <input
                                            type="text"
                                            value={episodeTitle}
                                            onChange={(e) => setEpisodeTitle(e.target.value)}
                                            placeholder="Enter episode title"
                                            className="episode-title-input"
                                        />
                                        <button onClick={handleSubmitEpisode} className="submit-episode-btn">
                                            Create Episode
                                        </button>
                                    </div>
                                )}

                                <div className="episodes-list">
                                    <h4>Episodes:</h4>
                                    {comic.episodes
                                        .sort((a, b) => a.number - b.number)
                                        .map((episode) => (
                                        <div key={episode.id} className="episode-item">
                                            <div className="episode-header" onClick={() => toggleEpisode(episode.id)}>
                                                <strong>Episode {episode.number}</strong> - {episode.title}
                                            </div>
                                            {expandedEpisode === episode.id && (
                                                <div className="episode-details">
                                                    <img src={episode.previewImage} alt="Preview" className="episode-preview" />
                                                    <p><strong>Total Images:</strong> {episode.images.length}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
