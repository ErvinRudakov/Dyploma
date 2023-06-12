import React, { useEffect, useState } from "react";
import {gapi} from 'gapi-script';
import axios from "axios";
import "./GoogleDrive.css";

const CLIENT_ID = "574939406601-23mji49d87k08f1rl8s76261f3dca0sl.apps.googleusercontent.com";
const API_KEY = 'AIzaSyBubiCBIvRD1vq1kc8VWWp7kGt8srSaVqA';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/drive';
const BASE_URL = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files"

export default function GoogleDrive({toDelete, setToDelete, toRename, setToRename, toDownload, setToDownload, setSearchFiles, currentFolder, setMyFiles, toOut, setToOut, toSign, setToSign, setSign, setInfo, fileToUpload, setFileToUpload, toUpload, setToUpload, searchQuery}) {
    const [accessToken, setAccessToken] = useState(null);
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        gapi.load("client:auth2", initClient);
        if(isSignedIn) {
            setAccessToken(gapi.auth.getToken().access_token);
            setSign(true);
            getFolders();
            getFiles();
            if(toOut){
                handleSignOut();
            }
        }
        else{
            setSign(false);
        }
        if(toSign){
            handleSignIn();
        }
    }, [isSignedIn,currentFolder,toSign,toOut]);
    useEffect(() => {
        if(accessToken) {
            handleDriveSizeInfo();
            setMyFiles([...folders, ...files])
        }
    },[accessToken,files,folders])
    useEffect(() => {
        if (searchQuery)
            handleFileSearch();
    },[searchQuery])

    useEffect(() => {
        if(fileToUpload && toUpload){
            handleGlobalUpload();
        }
    },[fileToUpload,toUpload])
    useEffect(() => {
        if(toDownload)
            handleDownloadClick(toDownload);
    }, [toDownload])
    useEffect(() => {
        if(toRename)
            handleRenameClick(toRename);
    }, [toRename])
    useEffect(() => {
        if(toDelete)
            handleDeleteClick(toDelete);
    }, [toDelete])
    const handleGlobalUpload = async () => {
        try {
            let folderId;
            if(currentFolder){
                folderId = currentFolder.key;
            }
            else{
                folderId = "root";
            }
            let file = fileToUpload;
            const url = `${UPLOAD_URL}?uploadType=multipart`;
            const headers = {
                'Content-Type': 'multipart/related',
                'Authorization': `Bearer ${accessToken}`
            };
            const meta = {
                name: file.name,
                mimeType: file.type,
                parents: [folderId]
            };
            const formData = new FormData();
            formData.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
            formData.append('file', file);
            await axios.post(url,
                formData,
                {headers}
            )
                .then(res=>{
                    setFiles([
                        ...files,
                        {
                            key: res.data.id,
                            name: file.name,
                            createdTime: new Date().toString(),
                            size: file.size,
                            type: "file",
                            service: "google"
                        },
                    ]);
                })
                .catch(e=>console.log(e));
            setFileToUpload(null);
            setToUpload(false);
        } catch (error) {
            console.error(error);
        }
    }

    const initClient = async () => {
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        });
    };
    const handleSignIn = () => {
        gapi.auth2.getAuthInstance().signIn()
            .then(() => {
                setIsSignedIn(true);
                setAccessToken(gapi.auth.getToken().access_token);
                setSign(true);
                setToSign(false);
            })
            .catch(() => setIsSignedIn(false))
    }
    const handleSignOut = () => {
        gapi.auth2.getAuthInstance().signOut()
            .then(() => {
                setIsSignedIn(false)
                setAccessToken(null);
                setSign(false);
                setToOut(false);
            })
    };
    const getFolders = async () => {
        try{
            let folderId;
            if(currentFolder)
                folderId = currentFolder.key;
            else
                folderId = 'root';
            const response = await axios.get(`${BASE_URL}`,{
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    orderBy: 'createdTime',
                    q: `'${folderId}' in parents and trashed=false and mimeType="application/vnd.google-apps.folder"`,
                    fields: 'nextPageToken, files(id, name, createdTime)'
                }
            })
            const foldersList = response.data.files;
            setFolders(
                foldersList.map((folder) => ({
                    key: folder.id,
                    name: folder.name,
                    createdTime: folder.createdTime,
                    size: '-',
                    type: "folder",
                    service: "google"
                }))
            );
        } catch (e) {
            console.error(e);
        }
    }
    const getFiles = async () => {
        try {
            let folderId;
            if(currentFolder)
                folderId = currentFolder.key;
            else
                folderId = 'root';
            const response = await axios.get(`${BASE_URL}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    orderBy: 'createdTime',
                    q: `'${folderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`,
                    fields: 'files(id, name, createdTime, size)'
                }
            })
            const filesList = response.data.files;
            setFiles(
                filesList.map((file) => ({
                    key: file.id,
                    name: file.name,
                    size: file.size,
                    createdTime: file.createdTime,
                    type: "file",
                    service: "google"
                }))
            );
        }catch (e) {
            console.error(e);
        }
    };
    const docsFormat = (params) => {
        let format;
        let mime = params.data.mimeType;
        if(mime.match(/.*\.document$/)){
            format = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            mime='docx';
        }
        else if(mime.match(/.*\.spreadsheet$/)){
            format = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            mime='xlsx';
        }
        else if(mime.match(/.*\.presentation$/)){
            format = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
            mime='pptx';
        }
        else{
            format = 'application/pdf';
            mime='pdf';
        }
        let result = {
            format: format,
            mime: mime
        }
        return result;
    }
    const handleDownloadClick = async (record) => {
        try {
            let params;
            await axios.get(`${BASE_URL}/${record.key}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    fields: 'id, name, mimeType, createdTime, size, webContentLink'
                }
            }).then(async res => {
                params = res
            })
            if(params.data.webContentLink){
                await axios.get(
                    `${BASE_URL}/${params.data.id}?alt=media`,
                    {
                        responseType: 'blob',
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                ).then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', params.data.name);
                    document.body.appendChild(link);
                    link.click();
                }).catch(e => {
                    console.error(e);
                });
            }
            else{
                const format = docsFormat(params).format;
                await axios.get(
                    `${BASE_URL}/${params.data.id}/export?mimeType=${format}`,
                    {
                        responseType: 'blob',
                        headers: {
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                ).then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `${params.data.name}.${docsFormat(params).mime}`);
                    document.body.appendChild(link);
                    link.click();
                }).catch(e => {
                    console.error(e);
                });
            }
            setToDownload(null);
        }catch(e) {
            console.error(e)
        }
    }

    const handleRenameClick = async (record) => {
        try {
            const fileRecord = record.file;
            const newName=record.name;
            await axios.patch(
                `${BASE_URL}/${fileRecord.key}`,
                { name: newName },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            if (fileRecord.type === "folder") {
                setFolders(
                    folders.map((folder) =>
                        folder.key === fileRecord.key ? { ...folder, name: newName } : folder
                    )
                );
            } else {
                setFiles(
                    files.map((file) => (file.key === fileRecord.key ? { ...file, name: newName } : file))
                );
            }
            setToRename(null);
        } catch (error) {
            console.error(error);
        }
    }
    const handleDeleteClick = async (record) => {
        try {
            await axios.patch(
                `${BASE_URL}/${record.key}`,
                { trashed: true },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
            if (record.type === "folder") {
                setFolders(folders.filter((folder) => folder.key !== record.key));
            } else {
                setFiles(files.filter((file) => file.key !== record.key));
            }
            setToDelete(null);
        } catch (error) {
            console.error(error);
        }
    };
    const handleDriveSizeInfo = async () => {
        await axios.get(`https://www.googleapis.com/drive/v3/about?fields=storageQuota`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }).then(res => {
            setInfo(res.data.storageQuota);
        });

    }
    const handleFileSearch = async () => {
        try {
            let filesSearch;
            await axios.get(`${BASE_URL}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                },
                params: {
                    orderBy: 'createdTime',
                    q: `trashed=false and mimeType!="application/vnd.google-apps.folder"`,
                    fields: 'files(id, name, createdTime, size)'
                }
            }).then(res => {
                const searchName = searchQuery.toLowerCase();
                filesSearch = res.data.files.filter(file => file.name.toLowerCase().includes(searchName));
            }).catch(e => console.error(e))
            filesSearch = filesSearch.map(res => ({
                key: res.id,
                name: res.name,
                size: res.size,
                createdTime: res.createdTime,
                type: "file",
                service: "google"
            }))

            setSearchFiles([
                ...filesSearch
            ])
        }catch (e) {
            console.error(e);
        }
    }
}