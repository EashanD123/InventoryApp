'use client';
import { useState, useEffect, useRef } from "react";
import { firestore } from "@/firebase";
import { Box, Typography, Modal, Stack, TextField, Button } from "@mui/material";
import { collection, query, getDocs, getDoc, setDoc, doc, deleteDoc } from "firebase/firestore";
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';
import Webcam from "react-webcam";

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [itemName, setItemName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [detectedObjects, setDetectedObjects] = useState([]);
  const imageRef = useRef(null);
  const webcamRef = useRef(null);
  const [model, setModel] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'));
    const docs = await getDocs(snapshot);
    const inventoryList = [];
    docs.forEach((doc) => {
      inventoryList.push({
        name: doc.id,
        ...doc.data()
      });
    });
    setInventory(inventoryList);
  };

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1 });
    } else {
      await setDoc(docRef, { quantity: 1 });
    }

    await updateInventory();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }

    await updateInventory();
  };

  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    };
    loadModel();
    updateInventory();
  }, []);

  const detectObjectsFromFile = async () => {
    if (model && imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth > 0 && imageRef.current.naturalHeight > 0) {
      const predictions = await model.detect(imageRef.current);
      setDetectedObjects(predictions);

      for (const obj of predictions) {
        await addItem(obj.class);
      }
    } else {
      console.error("Image is not loaded or has invalid dimensions.");
    }
  };

  const detectObjectsFromCamera = async () => {
    if (model && webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      const img = new Image();
      img.src = imageSrc;

      img.onload = async () => {
        const predictions = await model.detect(img);
        setDetectedObjects(predictions);

        for (const obj of predictions) {
          await addItem(obj.class);
        }
      };
    } else {
      console.error("Webcam is not available or model is not loaded.");
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCameraOpen = () => setCameraOpen(true);
  const handleCameraClose = () => setCameraOpen(false);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap={2}
    >
      <Modal open={open} onClose={handleClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={400}
          bgcolor="white"
          border="2px solid black"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: "translate(-50%, -50%)"
          }}
        >
          <Typography variant="h6">Add Item</Typography>
          <Stack width="100%" direction="row" spacing={2}>
            <TextField
              variant='outlined'
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <Button
              onClick={() => {
                addItem(itemName);
                setItemName('');
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={cameraOpen} onClose={handleCameraClose}>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          width={800}
          bgcolor="white"
          border="2px solid black"
          boxShadow={24}
          p={4}
          display="flex"
          flexDirection="column"
          gap={3}
          sx={{
            transform: "translate(-50%, -50%)"
          }}
        >
          <Typography variant="h6">Add Item from Camera</Typography>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            width={720}
            height={480}
          />
          <Button
            onClick={async () => {
              await detectObjectsFromCamera();
              handleCameraClose();
            }}
          >
            Detect and Add Items
          </Button>
        </Box>
      </Modal>

      <Box display="flex" flexDirection="row" justifyContent="center" alignItems="center" gap={2}>
        <Button variant="contained" onClick={handleOpen}>
          Add Item Manually
        </Button>
        <Button variant="contained" component="label">
          Add Item from Files
          <input
            type="file"
            accept="image/*"
            hidden
            key={fileInputKey}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = () => {
                  if (imageRef.current) {
                    imageRef.current.src = reader.result;
                    imageRef.current.onload = () => {
                      detectObjectsFromFile();
                    };
                  }
                };
                reader.readAsDataURL(e.target.files[0]);
                setFileInputKey(Date.now());
              }
            }}
          />
        </Button>
        <Button variant="contained" onClick={handleCameraOpen}>
          Add Item from Camera
        </Button>
      </Box>

      <Box border='1px solid #333'>
        <Box
          width="800px"
          height="100px"
          bgcolor="#ADD8E6"
          alignItems="center"
          justifyContent="center"
          display="flex"
        >
          <Typography variant="h2" color='#333'>
            Inventory Items
          </Typography>
        </Box>
        <Box width="800px">
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>
        <Stack width="800px" height="300px" spacing={2} overflow="auto">
          {filteredInventory.map(({ name, quantity }) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              bgcolor='#f0f0f0'
              padding={5}
            >
              <Typography variant="h3" color="#333" textAlign="center">
                {name.charAt(0).toUpperCase() + name.slice(1)}
              </Typography>
              <Typography variant="h3" color="#333" textAlign="center">
                {quantity}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => addItem(name)}>
                  Add
                </Button>
                <Button variant="contained" onClick={() => removeItem(name)}>
                  Remove
                </Button>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Box>

      <img
        ref={imageRef}
        alt="Uploaded"
        style={{ display: 'none' }}
        onError={() => console.error("Error loading image.")}
      />
    </Box>
  );
}
