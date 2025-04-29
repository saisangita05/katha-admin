import React, { useEffect, useState } from "react";
import { listAll, ref, getDownloadURL, uploadBytesResumable } from "firebase/storage";
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
    const [expandedChapter, setExpandedChapter] = useState(null);
    const [chapterTitle, setChapterTitle] = useState("");
    const [selectedComicId, setSelectedComicId] = useState(null);
    const [isCreatingChapter, setIsCreatingChapter] = useState(false);

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

    const fetchChapterImages = async (comicName, chapterNumber) => {
        try {
            const chapterPath = `${comicName}/Chapter ${String(chapterNumber).padStart(2, "0")}`;
            const chapterRef = ref(storage, chapterPath);
            const result = await listAll(chapterRef);

            const urls = await Promise.all(
                result.items.map(async (item) => {
                    const url = await getDownloadURL(item);
                    return url;
                })
            );

            return urls.sort();
        } catch (error) {
            console.error("Error fetching chapter images:", error);
            return [];
        }
    };

    const handleCreateChapter = async (comicId, comicName) => {
        setSelectedComicId(comicId);
        setIsCreatingChapter(true);
        setChapterTitle("");
    };

    const handleSubmitChapter = async () => {
        if (!chapterTitle || !selectedComicId) {
            alert("Please enter a chapter title");
            return;
        }

        try {
            const comic = comicsData.find(c => c.id === selectedComicId);
            if (!comic) return;

            const chapterNumber = comic.episodes ? comic.episodes.length + 1 : 1;
            const images = await fetchChapterImages(comic.title, chapterNumber);

            if (images.length === 0) {
                alert("No images found for this chapter in storage");
                return;
            }

            const paddedNumber = String(chapterNumber).padStart(2, '0');
            const chapterRef = doc(db, `comics/${selectedComicId}/episodes`, `chapter${paddedNumber}`);
            await setDoc(chapterRef, {
                number: chapterNumber,
                title: chapterTitle,
                previewImage: images[0],
                images: images
            });

            fetchComics();
            setIsCreatingChapter(false);
            setChapterTitle("");
            setSelectedComicId(null);
            alert("Chapter created successfully!");
        } catch (error) {
            console.error("Error creating chapter:", error);
            alert("Failed to create chapter");
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
        setExpandedChapter(null);
    };

    const toggleChapter = (id) => {
        setExpandedChapter(expandedChapter === id ? null : id);
    };

    const handleUploadFolder = async (e, comic) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
    
        try {
            const nextChapterNumber = (comic.episodes ? comic.episodes.length : 0) + 1;
            const paddedNumber = String(nextChapterNumber).padStart(2, "0");
            const uploadPromises = [];
    
            for (const file of files) {
                // Use the existing comic title in the path without creating a new folder
                const storagePath = `${comic.title}/Chapter ${paddedNumber}/${file.name}`;
                const fileRef = ref(storage, storagePath);
                uploadPromises.push(uploadBytesResumable(fileRef, file));
            }
    
            await Promise.all(uploadPromises);
            alert("Files uploaded successfully to existing comic folder!");
    
            const images = await fetchChapterImages(comic.title, nextChapterNumber);
            const chapterRef = doc(db, `comics/${comic.id}/episodes`, `chapter${paddedNumber}`);
            await setDoc(chapterRef, {
                number: nextChapterNumber,
                title: `Chapter ${nextChapterNumber}`,
                previewImage: images[0],
                images: images
            });
    
            fetchComics();
        } catch (error) {
            console.error("Error uploading files:", error);
            alert("Failed to upload files to existing comic folder");
        }
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
                <h3>Firestore Comics & Chapters</h3>
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
                                            className="create-chapter-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCreateChapter(comic.id, comic.title);
                                            }}
                                        >
                                            ➕ Create Chapter
                                        </button>

                                        <label className="upload-folder-btn">
                                            📁 Add New Chapter (Upload Folder)
                                            <input
                                                type="file"
                                                webkitdirectory="true"
                                                mozdirectory="true"
                                                directory=""
                                                multiple
                                                onChange={(e) => handleUploadFolder(e, comic)}
                                                style={{ display: "none" }}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="hero-image-container">
                                    <h4>Banner Image:</h4>
                                    <img src={comic.heroLandScapeImage} alt="Banner" className="hero-image" />
                                </div>

                                {isCreatingChapter && selectedComicId === comic.id && (
                                    <div className="create-chapter-form">
                                        <input
                                            type="text"
                                            value={chapterTitle}
                                            onChange={(e) => setChapterTitle(e.target.value)}
                                            placeholder="Enter chapter title"
                                            className="chapter-title-input"
                                        />
                                        <button onClick={handleSubmitChapter} className="submit-chapter-btn">
                                            Create Chapter
                                        </button>
                                    </div>
                                )}

                                <div className="chapters-list">
                                    <h4>Chapters:</h4>
                                    {comic.episodes
                                        .sort((a, b) => a.number - b.number)
                                        .map((chapter) => (
                                        <div key={chapter.id} className="chapter-item">
                                            <div className="chapter-header" onClick={() => toggleChapter(chapter.id)}>
                                                <strong>Chapter {chapter.number}</strong> - {chapter.title}
                                            </div>
                                            {expandedChapter === chapter.id && (
                                                <div className="chapter-details">
                                                    <img src={chapter.previewImage} alt="Preview" className="chapter-preview" />
                                                    <p><strong>Total Images:</strong> {chapter.images.length}</p>
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
