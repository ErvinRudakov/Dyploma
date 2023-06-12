import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './YandexDisk.css'

const CLIENT_ID = '78ad47808eea40c298e21e0a0549a123';
const CLIENT_SECRET = '92820d6c2d6c4eb58cc48c2c5381e4e4';
const REDIRECT_URI = 'http://localhost:3000';
const SCOPE = 'cloud_api:disk.read cloud_api:disk.write';
const BASE_URL = "https://cloud-api.yandex.net/v1/disk/resources";
const UPLOAD_URL = "https://cloud-api.yandex.net/v1/disk/resources/upload";

export default function YandexDisk({toDelete, setToDelete, toRename, setToRename, toDownload, setToDownload, setSearchFiles, currentFolder, setMyFiles, toOut, setToOut, toSign, setToSign, setSign, setInfo, fileToUpload, setFileToUpload, toUpload, setToUpload, searchQuery}) {
    const [code, setCode] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [folders, setFolders] = useState([]);
    const [files, setFiles] = useState([]);

    useEffect(() => {
        if(code){
            handleGetAccessToken(code);
        }
    },[code])
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
    useEffect(() => {
        if(accessToken) {
            getObjects();
            if(toOut){
                handleLogOut();
            }
        }
        else{
            setSign(false);
        }
        if(toSign){
            handleLogin();
        }
    }, [accessToken,currentFolder,toSign,toOut]);
    useEffect(() => {
        if(accessToken) {
            handleDiskSizeInfo();
            setMyFiles([...folders, ...files]);
        }

    },[accessToken,files,folders])
    useEffect(() => {
        if (searchQuery)
            handleFileSearch();
    },[searchQuery])
    const handleLogin = () => {
        try {
            const width = 600;
            const height = 600;
            const left = (window.screen.width / 2) - (width / 2);
            const top = (window.screen.height / 2) - (height / 2);
            const authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${SCOPE}&force_confirm=yes`;
            window.open(authUrl, 'yandexAuthWindow', `width=${width},height=${height},left=${left},top=${top}`);
            window.handleAuthCallback = handleAuthCallback;
        }catch (e) {
            console.error(e);
        }
    }
    const handleAuthCallback = (code) => {
        setCode(code);
    }
    const handleGetAccessToken = async (code) => {
        try {
            const data = new URLSearchParams();
            data.append('grant_type', 'authorization_code');
            data.append('code', code);
            data.append('client_id', CLIENT_ID);
            data.append('client_secret', CLIENT_SECRET);
            await axios.post('https://oauth.yandex.ru/token',data.toString(),{
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then(res => {
                setAccessToken(res.data.access_token);
                setSign(true);
                setToSign(false);
            }).catch(err => console.error(err));
        } catch (error) {
            console.error(error);
        }
    }

    const handleLogOut = () => {
        setAccessToken(null);
        setCode(null);
        setSign(false);
        setToOut(false);
    }

    const getObjects = async () => {
        try {
            let path;
            if(currentFolder)
                path = currentFolder.key;
            else
                path = 'disk:/';

            await axios.get(BASE_URL, {
                headers: {
                    'Authorization': `OAuth ${accessToken}`
                },
                params: {
                    path,
                    fields: '_embedded'
                }
            }).then(res => {
                const foldersList = res.data._embedded.items.filter(item => item.type === 'dir');
                setFolders(
                    foldersList.map((folder) => ({
                        key: folder.path,
                        name: folder.name,
                        createdTime: folder.modified,
                        size: '-',
                        type: "folder",
                        service: "yandex"
                    }))
                )
                const filesList = res.data._embedded.items.filter(item => item.type === 'file');
                setFiles(
                filesList.map((file) => ({
                    key: file.path,
                    name: file.name,
                    size: file.size,
                    createdTime: file.modified,
                    type: "file",
                    service: "yandex"
                })))
            }).catch(e => console.error(e))
        }catch (e) {
            console.error(e)
        }
    }

    const handleRenameClick = async (record) => {
        try {
            const newName = record.name;
            const fileRecord = record.file;
            const oldPath = fileRecord.key;
            const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName;
            await axios.post(`${BASE_URL}/move?from=${encodeURIComponent(oldPath)}&path=${encodeURIComponent(newPath)}`, null,
            {
                headers: {
                    'Authorization': `OAuth ${accessToken}`
                },
            }).then(res => console.log(res))
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
            await axios.delete(`${BASE_URL}?path=${record.key}`,
                {
                    headers: {
                        Authorization: `OAuth ${accessToken}`,
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
    }


    const handleGlobalUpload = async () => {
        try {
            let path;
            if (currentFolder) {
                path = currentFolder.key + "/";
            } else {
                path = "disk:/";
            }
            path = path + fileToUpload.name;
            await axios.get(`${UPLOAD_URL}?path=${path}`, {
                headers: {
                    'Authorization': `OAuth ${accessToken}`
                }
            }).then(async res => {
                await axios.put(res.data.href, fileToUpload, {
                    headers: {
                        'Content-Type': fileToUpload.type,
                        'Authorization': `OAuth ${accessToken}`
                    }
                }).then(() => {
                    setFiles([
                        ...files,
                        {
                            key: path,
                            name: fileToUpload.name,
                            createdTime: new Date().toString(),
                            size: fileToUpload.size,
                            type: "file",
                            service: "yandex"
                        },
                    ]);
                }).catch(e=>console.log(e));;
            })
            setFileToUpload(null);
            setToUpload(false);
        } catch (error) {
            console.error(error);
        }
    }
    const handleDownloadClick = async (record) => {
        try {
            const path = record.key;
            await axios.get(
                `${BASE_URL}/download?path=${encodeURIComponent(path)}`,
                { headers: { Authorization: `OAuth ${accessToken}` } }
            ).then(async res => {
                await axios.get(res.data.href, { responseType: 'blob' }).then(result => {
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(new Blob([result.data]));
                    link.setAttribute('download', path.split('/').pop());
                    document.body.appendChild(link);
                    link.click();
                });
            }).catch(err => console.error(err));
            setToDownload(null);
        }catch(e) {
            console.error(e)
        }
    }

    const handleFileSearch = async () => {
        try {
            await axios.get(`${BASE_URL}/files`, {
                headers: { Authorization: `OAuth ${accessToken}` }
            }).then(res => {
                let filesSearch = res.data.items;
                const searchName = searchQuery.toLowerCase();
                filesSearch = filesSearch.filter(file => file.name.toLowerCase().includes(searchName));
                let filesList = filesSearch.filter(file => file.type === 'file');
                filesList = filesList.map((file) => ({
                    key: file.path,
                    name: file.name,
                    size: file.size,
                    createdTime: file.modified,
                    type: "file",
                    service: "yandex"
                }))
                setSearchFiles([
                    ...filesList
                ])
                });
        }catch (e) {
            console.error(e);
        }
    }
    const handleDiskSizeInfo = async () => {
        await axios.get(`https://cloud-api.yandex.net/v1/disk`, {
            headers: {
                'Authorization': `OAuth ${accessToken}`
            },
            params: {
                fields: 'data'
            }
        }).then(res => {
            setInfo(res.data);
        }).catch(err => console.error(err));
    }
};
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
if (code) {
    window.opener.handleAuthCallback(code);
    window.close();
}
