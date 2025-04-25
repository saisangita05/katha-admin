import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebase";
import { useNavigate } from "react-router-dom";

const AddNewComic = () => {
    const navigate = useNavigate();
    const [comicName, setComicName] = useState("");
    const [episodeCount, setEpisodeCount] = useState(0);
    const [episodeFiles, setEpisodeFiles] = useState({});
    const [coverImageFile, setCoverImageFile] = useState(null);
    const [heroImageFile, setHeroImageFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [coverImageURL, setCoverImageURL] = useState("");
    const [heroImageURL, setHeroImageURL] = useState("");

    const handleFolderSelect = (e, episodeIndex) => {
        const selectedFiles = Array.from(e.target.files);
        setEpisodeFiles((prev) => ({
            ...prev,
            [episodeIndex]: selectedFiles,
        }));
    };

    const handleUpload = () => {
        if (!comicName || episodeCount === 0) {
            alert("Enter comic name and number of episodes.");
            return;
        }

        let totalFiles = 0;
        let uploadedFiles = 0;
        let tempCoverURL = "";
        let tempHeroURL = "";

        Object.keys(episodeFiles).forEach((index) => {
            totalFiles += episodeFiles[index].length;
        });

        if (coverImageFile) totalFiles++;
        if (heroImageFile) totalFiles++;

        if (totalFiles === 0) {
            alert("Please upload at least one file.");
            return;
        }

        setUploading(true);

        const checkUploadComplete = () => {
            uploadedFiles++;
            if (uploadedFiles === totalFiles) {
                setUploading(false);
                const confirmed = window.confirm("🎉 All episodes and images have been uploaded successfully! Click OK to proceed.");
                if (confirmed) {
                    navigate("/add-new-comics-firestore", {
                        state: {
                            comicName,
                            coverImageURL: tempCoverURL,
                            heroImageURL: tempHeroURL,
                        },
                    });
                }
            }
        };

        // Upload cover image
        if (coverImageFile) {
            const coverPath = `${comicName}/${coverImageFile.name}`;
            const coverRef = ref(storage, coverPath);
            const coverTask = uploadBytesResumable(coverRef, coverImageFile);
            coverTask.on(
                "state_changed",
                null,
                (error) => console.error("Cover image upload failed:", error),
                () => {
                    getDownloadURL(coverTask.snapshot.ref).then((url) => {
                        console.log("✅ Cover image uploaded:", url);
                        tempCoverURL = url;
                        setCoverImageURL(url);
                        checkUploadComplete();
                    });
                }
            );
        }

        // Upload hero image
        if (heroImageFile) {
            const heroPath = `${comicName}/${heroImageFile.name}`;
            const heroRef = ref(storage, heroPath);
            const heroTask = uploadBytesResumable(heroRef, heroImageFile);

            heroTask.on(
                "state_changed",
                null,
                (error) => console.error("Hero image upload failed:", error),
                () => {
                    getDownloadURL(heroTask.snapshot.ref).then((url) => {
                        console.log("✅ Hero image uploaded:", url);
                        tempHeroURL = url;
                        setHeroImageURL(url);
                        checkUploadComplete();
                    });
                }
            );
        }

        // Upload episode files
        Object.keys(episodeFiles).forEach((index) => {
            const files = episodeFiles[index];
            files.forEach((file) => {
                const storagePath = `${comicName}/Episode ${String(+index + 1).padStart(2, "0")}/${file.name}`;
                const storageRef = ref(storage, storagePath);
                const uploadTask = uploadBytesResumable(storageRef, file);

                uploadTask.on(
                    "state_changed",
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`Uploading ${file.name} to Episode ${+index + 1}... ${progress.toFixed(1)}%`);
                    },
                    (error) => {
                        console.error("Upload failed:", error);
                    },
                    () => {
                        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                            console.log(`✅ Uploaded: ${file.name}`);
                            console.log(`🔗 Download URL: ${url}`);
                            checkUploadComplete();
                        });
                    }
                );
            });
        });
    };

    return (
        <div style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            minHeight: "100vh",
            padding: "2rem",
            fontFamily: "sans-serif",
            maxWidth: "900px",
            margin: "0 auto"
        }}>
            <h1 style={{
                textAlign: "center",
                marginBottom: "2rem",
                color: "#A3D749"
            }}>📚 Comic Upload Portal</h1>

            <div style={{ marginBottom: "1rem" }}>
                <label>📝 Comic Name:</label><br />
                <input
                    type="text"
                    value={comicName}
                    onChange={(e) => setComicName(e.target.value)}
                    placeholder="Enter comic name"
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        marginTop: "0.5rem",
                        border: "1px solid #A3D749",
                        backgroundColor: "#1a1a1a",
                        color: "white",
                        borderRadius: "6px"
                    }}
                />
            </div>

            <div style={{ marginBottom: "1rem" }}>
                <label>🖼️ Cover Image:</label><br />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverImageFile(e.target.files[0])}
                    style={{ marginTop: "0.5rem", color: "white" }}
                />
            </div>

            <div style={{ marginBottom: "1rem" }}>
                <label>🌄 Hero Landscape Image:</label><br />
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setHeroImageFile(e.target.files[0])}
                    style={{ marginTop: "0.5rem", color: "white" }}
                />
            </div>

            <div style={{ marginBottom: "1rem" }}>
                <label>🔢 Number of Episodes:</label><br />
                <input
                    type="number"
                    value={episodeCount}
                    min={1}
                    onChange={(e) => setEpisodeCount(Number(e.target.value))}
                    placeholder="Enter episode count"
                    style={{
                        width: "100%",
                        padding: "0.75rem",
                        marginTop: "0.5rem",
                        border: "1px solid #A3D749",
                        backgroundColor: "#1a1a1a",
                        color: "white",
                        borderRadius: "6px"
                    }}
                />
            </div>

            {Array.from({ length: episodeCount }).map((_, idx) => (
                <div key={idx} style={{
                    marginBottom: "1rem",
                    border: "1px dashed #A3D749",
                    padding: "1rem",
                    borderRadius: "6px",
                    backgroundColor: "#111"
                }}>
                    <label>📁 Upload Folder for Episode {String(idx + 1).padStart(2, "0")}:</label><br />
                    <input
                        type="file"
                        webkitdirectory="true"
                        directory=""
                        multiple
                        onChange={(e) => handleFolderSelect(e, idx)}
                        style={{ marginTop: "0.5rem", color: "white" }}
                    />
                </div>
            ))}

            <button
                onClick={handleUpload}
                style={{
                    backgroundColor: uploading ? "#666" : "#A3D749",
                    color: "#000000",
                    padding: "1rem 2rem",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    cursor: uploading ? "not-allowed" : "pointer",
                    marginTop: "2rem",
                    width: "100%"
                }}
                disabled={uploading}
            >
                {uploading ? "Uploading..." : "🚀 Upload All Episodes"}
            </button>
        </div>
    );
};

export default AddNewComic;
