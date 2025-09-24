"use client";

import { useEffect, useRef, useState } from "react";
import { db } from "../../../lib/firebase.config";
import {
  doc,
  setDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  deleteDoc,
} from "firebase/firestore";

interface Props {
  roomId: string;
  currentUser: string;
  peerUser: string;
}

export default function VideoCall({ roomId, currentUser, peerUser }: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [incomingCall, setIncomingCall] = useState<any>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);

  useEffect(() => {
    if (!roomId || !currentUser) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    pcRef.current = pc;

    // Local stream
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      });

    // Remote stream
    pc.ontrack = (e) => {
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = e.streams[0];
    };

    // ICE → Firestore
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        updateDoc(doc(db, "calls", roomId), {
          [`candidates_${currentUser}`]: arrayUnion(e.candidate.toJSON()),
        });
      }
    };

    // Lắng nghe Firestore
    const unsub = onSnapshot(doc(db, "calls", roomId), async (snap) => {
      const data = snap.data();
      if (!data) return;

      // Nếu có offer mà mình chưa trả lời
      if (data.offer && !data.answer && data.callee === currentUser) {
        setIncomingCall(data);
      }

      // Nếu mình là caller và có answer
      if (
        data.answer &&
        data.caller === currentUser &&
        pc.signalingState !== "stable"
      ) {
        await pc.setRemoteDescription(data.answer);

        pendingCandidates.current.forEach((c) =>
          pc.addIceCandidate(new RTCIceCandidate(c))
        );
        pendingCandidates.current = [];
      }

      // Nhận ICE
      const candidates = data?.[`candidates_${peerUser}`] || [];
      candidates.forEach(async (c: RTCIceCandidateInit) => {
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(c));
        } else {
          pendingCandidates.current.push(c);
        }
      });
    });

    return () => {
      unsub();
      pc.close();
      deleteDoc(doc(db, "calls", roomId));
    };
  }, [roomId, currentUser, peerUser]);

  // Caller: gọi peerUser
  const callUser = async () => {
    if (!pcRef.current) return;
    const pc = pcRef.current;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await setDoc(doc(db, "calls", roomId), {
      offer,
      caller: currentUser,
      callee: peerUser,
      candidates_user01: [],
      candidates_user02: [],
    });
  };

  // Callee: trả lời khi có offer
  const answerCall = async () => {
    if (!incomingCall || !pcRef.current) return;
    const pc = pcRef.current;

    await pc.setRemoteDescription(incomingCall.offer);

    pendingCandidates.current.forEach((c) =>
      pc.addIceCandidate(new RTCIceCandidate(c))
    );
    pendingCandidates.current = [];

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    await updateDoc(doc(db, "calls", roomId), { answer });
    setIncomingCall(null);
  };


  return (
    <div>
      <h3>
        Room: {roomId} | {currentUser} ↔ {peerUser}
      </h3>

      {/* <div style={{ display: "flex", gap: "10px" }}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: 200 }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: 200 }}
        />
      </div> */}

      <div style={{ marginTop: 10 }}>
        <button onClick={callUser}>📞 Call</button>
        {incomingCall && (
          <button onClick={answerCall} style={{ marginLeft: 10 }}>
            ✅ Answer
          </button>
        )}
      </div>
    </div>
  );
}
