import {useEffect,useState} from "react";
import {Button, Table, Modal, Form, Input} from "antd";
import './App.css';
import GoogleDrive from "./Google/GoogleDrive";
import YandexDisk from "./Yandex/YandexDisk";

export default function App() {
  const [googleSigned, setGoogleSigned] = useState(false);
  const [yandexSigned, setYandexSigned] = useState(false);
  const [toGoogleSign, setToGoogleSign] = useState(false);
  const [toYandexSign, setToYandexSign] = useState(false);
  const [googleFolder, setGoogleFolder] = useState('');
  const [yandexFolder, setYandexFolder] = useState('');
  const [googleFiles, setGoogleFiles] = useState([]);
  const [yandexFiles, setYandexFiles] = useState([]);
  const [toGoogleSignOut, setToGoogleSignOut] = useState(false);
  const [toYandexSignOut, setToYandexSignOut] = useState(false);
  const [allSigned, setAllSigned] = useState(false);
  const [uploadSelectModalVisible, setUploadSelectModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [yandexInfo, setYandexInfo] = useState(null);
  const [googleInfo, setGoogleInfo] = useState(null);
  const [uploadSelectForm] = Form.useForm();
  const [newNameModalVisible, setNewNameModalVisible] = useState(false);
  const [newNameForm] = Form.useForm();
  const [toYandex, setToYandex] = useState(false);
  const [toGoogle, setToGoogle] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [googleDownload, setGoogleDownload] = useState(null);
  const [yandexDownload, setYandexDownload] = useState(null);
  const [newNameRecord, setNewNameRecord] = useState(null);
  const [newNameGoogleRecord, setNewNameGoogleRecord] = useState(null);
  const [newNameYandexRecord, setNewNameYandexRecord] = useState(null);
  const [googleDelete, setGoogleDelete] = useState(null);
  const [yandexDelete, setYandexDelete] = useState(null);
  const [googleSearch, setGoogleSearch] = useState([]);
  const [yandexSearch, setYandexSearch] = useState([]);

  useEffect(() => {
    if(googleSigned && yandexSigned){
      setAllSigned(true);
    }
    else{
      setAllSigned(false);
    }
  },[googleSigned, yandexSigned]);
  // useEffect(() => {
  //   if(allSigned){
  //     handleRecommendations();
  //   }
  // },[yandexInfo, googleInfo])
  const handleSelectFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    // handleRecommendations();
  }
  const handleSelectClick = () => {
    setUploadSelectModalVisible(true);
  };

  const handleUploadSelectOkClick = () => {
    let google = false;
    let yandex = false;
    let fileSize = selectedFile.size;
    if(googleInfo.limit - googleInfo.usage - fileSize < 10240){
      google = false;
    }
    else
      google = true;
    if(yandexInfo.total_space - yandexInfo.used_space - fileSize < 10240){
      yandex = false;
    }
    else
      yandex = true;
    if(yandex && google){
      if(googleInfo.limit - googleInfo.usage - fileSize > yandexInfo.total_space - yandexInfo.used_space - fileSize){
        setToGoogle(true);
        setToYandex(false);
      }
      else{
        setToYandex(true);
        setToGoogle(false);
      }
    }
    else{
      if(yandex){
        setToYandex(true);
        setToGoogle(false);
      }
      if(google){
        setToGoogle(true);
        setToYandex(false);
      }
      // if(!yandex && !google){
      //
      // }
      uploadSelectForm.resetFields();
      setUploadSelectModalVisible(false);
    }
  }
  const handleUploadSelectCancelClick = () => {
    uploadSelectForm.resetFields();
    setUploadSelectModalVisible(false);
    setSelectedFile(null);
    setToYandex(false);
    setToGoogle(false);
  }
  const GoogleSign = () => {
    setToGoogleSign(true);
  }
  const YandexSign = () => {
    setToYandexSign(true);
  }

  const handleGoogleSignOut = () => {
    setToGoogleSignOut(true);
  }

  const handleYandexSignOut = () => {
    setToYandexSignOut(true);
  }

  const sizeRender = (size) => {
    const sizeUnits = ['KB','MB','GB'];
    let i = -1;
    do{
      size = size / 1024;
      i++;
    }while(size > 1024);
    return Math.max(size,0.1).toFixed(1)+''+sizeUnits[i];
  }

  const handleNavigateClick = (folder) => {
    if(folder.service === "google"){
      setGoogleFolder(folder);
      setYandexFolder('');
    }
    if(folder.service === "yandex"){
      setYandexFolder(folder);
      setGoogleFolder('');
    }
  };

  const handleBackClick = () => {
    setYandexFolder('');
    setGoogleFolder('');
  }

  const handleDownloadClick = (record) => {
    if(record.service === "google")
      setGoogleDownload(record);
    else
      setYandexDownload(record);
  }


  const handleRenameClick = (record) => {
    setNewNameRecord(record);
    setNewNameModalVisible(true);
  };
  const handleRenameOkClick = () => {
      let newName = newNameForm.getFieldValue('Name');
      const record = newNameRecord;
      if(record.service === "google")
        setNewNameGoogleRecord({
          file: record,
          name: newName
        })
      else
        setNewNameYandexRecord({
          file: record,
          name: newName
        })
    newNameForm.resetFields();
    setNewNameRecord(null);
    setNewNameModalVisible(false);
  }
  const handleRenameCancelClick = () => {
    newNameForm.resetFields();
    setNewNameRecord(null);
    setNewNameModalVisible(false);
  }

  const handleDeleteClick = (record) => {
    if(record.service === "google")
      setGoogleDelete(record);
    else
      setYandexDelete(record);
  };





  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      width: 300,
      key: "name",
      render: (text, record) =>
          record.type === "folder" ? (
              <Button className={"link-btn"} type="link" onClick={() => handleNavigateClick(record)}>{text}</Button>
          ) : (text)
    },
    {
      title: "Created Date",
      dataIndex: "createdTime",
      key: "createdTime",
      render: time => new Date(time).toLocaleString()
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
      render: (text, record) => record.type !== 'folder' ? (sizeRender(text)) : (text)
    },
    {
      title: "Service",
      dataIndex: "service",
      key: "service",
      render: text => {
        if (text === "google") return "Google Drive";
        else return "Яндекс.Диск";
      }
    },
    {
      title: "Actions",
      dataIndex: "",
      key: "actions",
      render: (text, record) => (
          <div>
            {record.type !== 'folder'? (<Button onClick={() => handleDownloadClick(record)}>Download</Button>) : (<></>)}
            <Button onClick={() => handleRenameClick(record)}>Rename</Button>
            <Button onClick={() => handleDeleteClick(record)}>Delete</Button>
          </div>
      ),
    },
  ];

  return(
      <>
        {!allSigned &&
            <>
              <h2>You need to log in to both services</h2>
              {!googleSigned && <Button onClick={GoogleSign}>Sign in to Google Drive</Button>}
              {!yandexSigned && <Button onClick={YandexSign}>Sign in to Yandex.Disk</Button> }
            </>
        }
        <Modal
            open={newNameModalVisible}
            onOk={handleRenameOkClick}
            onCancel={handleRenameCancelClick}
            title="New name">
          <Form form={newNameForm}>
            <Form.Item label="Name" name="Name" rules={[{ required: true, message: "Please select new name" }]}>
              <Input />
            </Form.Item>
          </Form>
        </Modal>
        {allSigned &&
            <>
              <Input.Search
                  placeholder="Search files and folders"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
              />
              <Button onClick={handleSelectClick}>Upload File</Button>
              <Modal
                  open={newNameModalVisible}
                  onOk={handleRenameOkClick}
                  onCancel={handleRenameCancelClick}
                  title="New name">
                  <Form form={newNameForm}>
                      <Form.Item label="Name" name="Name" rules={[{ required: true, message: "Please select new name" }]}>
                          <Input />
                      </Form.Item>
                  </Form>
              </Modal>
              <Modal
                  open={uploadSelectModalVisible}
                  onOk={handleUploadSelectOkClick}
                  onCancel={handleUploadSelectCancelClick}
                  title="Upload file">
                <Form form={uploadSelectForm}>
                  <Form.Item label="File" name="file" rules={[{ required: true, message: "Please select file" }]}>
                    <Input type="file" onChange={handleSelectFileChange} />
                  </Form.Item>
                </Form>
              </Modal>
            </>}
        <div>
              <GoogleDrive
                  setSearchFiles={setGoogleSearch}
                  toDelete={googleDelete}
                  setToDelete={setGoogleDelete}
                  toRename={newNameGoogleRecord}
                  setToRename={setNewNameGoogleRecord}
                  toDownload={googleDownload}
                  setToDownload={setGoogleDownload}
                  currentFolder={googleFolder}
                  setMyFiles={setGoogleFiles}
                  toOut={toGoogleSignOut}
                  setToOut={setToGoogleSignOut}
                  toSign={toGoogleSign}
                  setToSign={setToGoogleSign}
                  setSign={setGoogleSigned}
                  setInfo={setGoogleInfo}
                  fileToUpload={selectedFile}
                  setFileToUpload={setSelectedFile}
                  toUpload={toGoogle}
                  setToUpload={setToGoogle}
                  searchQuery={searchQuery}
              />
              <YandexDisk
                  setSearchFiles={setYandexSearch}
                  toDelete={yandexDelete}
                  setToDelete={setYandexDelete}
                  toRename={newNameYandexRecord}
                  setToRename={setNewNameYandexRecord}
                  toDownload={yandexDownload}
                  setToDownload={setYandexDownload}
                  currentFolder={yandexFolder}
                  setMyFiles={setYandexFiles}
                  toOut={toYandexSignOut}
                  setToOut={setToYandexSignOut}
                  toSign={toYandexSign}
                  setToSign={setToYandexSign}
                  setSign={setYandexSigned}
                  setInfo={setYandexInfo}
                  fileToUpload={selectedFile}
                  setFileToUpload={setSelectedFile}
                  toUpload={toYandex}
                  setToUpload={setToYandex}
                  searchQuery={searchQuery}
              />
          {searchQuery!=='' ? (<Table dataSource={[...googleSearch, ...yandexSearch]} columns={columns}/>) : (<div>
            {(googleFolder || yandexFolder) && <Button onClick={handleBackClick}>Back</Button>}
            {(!googleFolder && !yandexFolder) && <Table dataSource={[...googleFiles, ...yandexFiles]} columns={columns}/>}
            {(!googleFolder && yandexFolder) && <Table dataSource={[...yandexFiles]} columns={columns}/>}
            {(googleFolder && !yandexFolder) && <Table dataSource={[...googleFiles]} columns={columns}/>}
          </div>)}


        </div>
        {googleSigned && <Button onClick={handleGoogleSignOut}>Sign out from Google Drive</Button>}
        {yandexSigned && <Button onClick={handleYandexSignOut}>Sign out from Yandex.Disk</Button>}
      </>
  )

}
