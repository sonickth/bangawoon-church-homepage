import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, X, MapPin, Clock3, Instagram, Youtube, Heart, Sparkles, UsersRound, BookOpen, Cross, ChevronRight, LogIn, LogOut, ShieldCheck, Upload, ImagePlus, Copy, ExternalLink } from 'lucide-react';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import churchLogo from './assets/bangawoon-ci.webp';
import { auth, db, storage } from './firebase';
import './style.css';
import './boards.css';
import './admin.css';

const address = '서울 성북구 성북로4길 52, 한신한진아파트 411동 근린상가 3층 3302호';
const nav = [
  { title: '교회소개', links: ['반가운교회', '목회철학', '담임목사', '오시는 길'] },
  { title: '예배와 말씀', links: ['예배 안내', '말씀 나눔', '기도 모임'] },
  { title: '공동체', links: ['함께하는 사람들', '다음세대', '소그룹'] },
  { title: '소식과 나눔', links: ['교회 소식', '교회사진 게시판', '주보 게시판'] },
];
const pageIds = ['intro', 'worship', 'community', 'news'];
const sectionPages = {
  '반가운교회': ['intro', 'about'], '목회철학': ['intro', 'beliefs'], '담임목사': ['intro', 'story'], '오시는 길': ['intro', 'visit'],
  '예배 안내': ['worship', 'worship'], '말씀 나눔': ['worship', 'word'], '기도 모임': ['worship', 'prayer'],
  '함께하는 사람들': ['community', 'people'], '다음세대': ['community', 'nextgen'], '소그룹': ['community', 'smallgroup'],
  '교회 소식': ['news', 'bulletin'], '교회사진 게시판': ['news', 'gallery'], '주보 게시판': ['news', 'bulletin'],
};
const beliefs = [
  ['01', '하나님과 사귀는 신앙', '문제 해결을 넘어 하나님과의 인격적인 사귐을 신앙의 중심에 둡니다.', 'heart'],
  ['02', '오늘 여기의 하나님 나라', '죽어서 가는 천국만이 아니라, 지금 우리의 삶에 임하는 하나님 나라를 살아갑니다.', 'sparkles'],
  ['03', '마음에서 시작되는 변화', '겉으로 보이는 활동보다 한 사람의 마음이 말씀 안에서 새로워지는 일에 집중합니다.', 'book'],
  ['04', '함께 자라는 영적 공동체', '있는 모습 그대로 서로 사랑하며, 진실한 나눔으로 함께 성장합니다.', 'people'],
];
const media = (filename) => `${import.meta.env.BASE_URL}media/${filename}`;
const initialPosts = [
  { id: 'story-first-worship', type: 'gallery', title: '개척 첫 예배', description: '목사님 가정에서 드린 반가운교회의 첫 예배입니다.', date: '2026-02', filename: 'story-first-worship.webp' },
  { id: 'story-practice-room', type: 'gallery', title: '연습실 첫 예배', description: '연습실을 빌려 예배와 식사, 나눔을 함께했던 시간입니다.', date: '2026-04', filename: 'story-practice-room.webp' },
  { id: 'story-new-sanctuary', type: 'gallery', title: '새 성전 입당', description: '2026년 10월 4일, 새 성전에서 첫 예배를 드렸습니다.', date: '2026-10-04', filename: 'story-new-sanctuary.webp' },
  { id: 'bulletin-20261011', type: 'bulletin', title: '2026년 10월 11일 주보 · 제34호', description: '주일 예배 순서와 교회 소식, 한 주간 묵상 본문을 확인하세요.', date: '2026-10-11', filename: 'bulletin-20261011.webp' },
].map((item) => ({ ...item, localUrl: media(item.filename) }));
const Icon = ({ name, ...props }) => ({ heart: <Heart {...props}/>, sparkles: <Sparkles {...props}/>, book: <BookOpen {...props}/>, people: <UsersRound {...props}/> }[name]);

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState('');
  const [page, setPage] = useState(() => {
    const requestedPage = new URLSearchParams(window.location.search).get('page');
    return pageIds.includes(requestedPage) ? requestedPage : 'intro';
  });
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecking, setAdminChecking] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [remotePosts, setRemotePosts] = useState([]);
  const [cloudManaged, setCloudManaged] = useState(false);
  const [cloudError, setCloudError] = useState(false);
  const [viewer, setViewer] = useState(null);
  const [seedBusy, setSeedBusy] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [newType, setNewType] = useState('gallery');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(new Date().toLocaleDateString('sv-SE'));
  const [newDescription, setNewDescription] = useState('');
  const [newFile, setNewFile] = useState(null);
  const [editingPost, setEditingPost] = useState(null);

  const navigatePage = (nextPage) => {
    const safePage = pageIds.includes(nextPage) ? nextPage : 'intro';
    window.history.pushState({ page: safePage }, '', safePage === 'intro' ? window.location.pathname : `?page=${safePage}`);
    setPage(safePage); setMenuOpen(false); setActive(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const jump = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMenuOpen(false); setActive(''); };
  const openSubmenu = (label) => {
    const [targetPage, sectionId] = sectionPages[label] || ['intro', 'about'];
    if (targetPage !== page) {
      window.history.pushState({ page: targetPage }, '', `?page=${targetPage}#${sectionId}`);
      setPage(targetPage); setMenuOpen(false); setActive('');
      window.setTimeout(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } else jump(sectionId);
  };
  useEffect(() => {
    const handlePopState = () => {
      const requestedPage = new URLSearchParams(window.location.search).get('page');
      setPage(pageIds.includes(requestedPage) ? requestedPage : 'intro');
      window.scrollTo(0, 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    setIsAdmin(false);
    if (!currentUser) { setAdminChecking(false); return; }
    setAdminChecking(true);
    try {
      const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      setIsAdmin(adminDoc.exists());
    } catch {
      setIsAdmin(false);
    } finally {
      setAdminChecking(false);
    }
  }), []);

  useEffect(() => {
    const q = query(collection(db, 'posts'), where('published', '==', true));
    const stopPosts = onSnapshot(q, (snapshot) => {
      setRemotePosts(snapshot.docs.map((post) => ({ id: post.id, ...post.data(), isCloud: true })));
      setCloudError(false);
    }, () => setCloudError(true));
    const stopSettings = onSnapshot(doc(db, 'siteSettings', 'content'), (snapshot) => {
      setCloudManaged(snapshot.exists() && snapshot.data().managed === true);
    }, () => setCloudError(true));
    return () => { stopPosts(); stopSettings(); };
  }, []);

  const posts = useMemo(() => {
    if (cloudManaged) return remotePosts.map((post) => ({ ...post, imageUrl: post.imageUrl || '' })).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const remoteById = new Map(remotePosts.map((post) => [post.id, post]));
    const seeded = initialPosts.map((post) => {
      const cloudPost = remoteById.get(post.id);
      remoteById.delete(post.id);
      return { ...post, ...cloudPost, imageUrl: cloudPost?.imageUrl || post.localUrl, localUrl: post.localUrl };
    });
    const extra = [...remoteById.values()].map((post) => ({ ...post, imageUrl: post.imageUrl || '' }));
    return [...seeded, ...extra].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [remotePosts, cloudManaged]);
  const galleryPosts = posts.filter((post) => post.type === 'gallery');
  const bulletinPosts = posts.filter((post) => post.type === 'bulletin');

  const refreshAdmin = async () => {
    if (!user) return;
    setAdminChecking(true);
    try { setIsAdmin((await getDoc(doc(db, 'admins', user.uid))).exists()); }
    catch { setIsAdmin(false); }
    finally { setAdminChecking(false); }
  };

  const handleAuth = async (event) => {
    event.preventDefault(); setAuthError(''); setAuthMessage(''); setAuthBusy(true);
    try {
      if (authMode === 'signup') {
        const result = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        if (displayName.trim()) await updateProfile(result.user, { displayName: displayName.trim() });
        setAuthMessage('가입이 완료됐습니다. 게시 권한은 교회 관리자가 승인한 뒤 활성화됩니다.');
      } else {
        await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        setAuthMessage('로그인했습니다.');
      }
      setAuthPassword('');
    } catch (error) {
      const messages = {
        'auth/email-already-in-use': '이미 가입된 이메일입니다. 로그인해 주세요.',
        'auth/invalid-credential': '이메일 또는 비밀번호를 확인해 주세요.',
        'auth/weak-password': '비밀번호는 6자 이상 입력해 주세요.',
        'auth/invalid-email': '이메일 주소를 확인해 주세요.',
        'auth/operation-not-allowed': 'Firebase Console에서 이메일/비밀번호 로그인을 먼저 켜야 합니다.',
        'auth/network-request-failed': '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
      };
      setAuthError(messages[error.code] || '인증을 완료하지 못했습니다. Firebase 설정을 확인해 주세요.');
    } finally { setAuthBusy(false); }
  };

  const publishInitialContent = async () => {
    if (!isAdmin) return;
    setSeedBusy(true); setUploadStatus('초기 사진과 주보를 Firebase에 올리는 중입니다.'); setUploadError('');
    try {
      for (let i = 0; i < initialPosts.length; i += 1) {
        const post = initialPosts[i];
        setUploadStatus(`초기 자료 업로드 중 (${i + 1}/${initialPosts.length}) · ${post.title}`);
        const response = await fetch(post.localUrl);
        if (!response.ok) throw new Error(`${post.filename} 파일을 읽지 못했습니다.`);
        const file = await response.blob();
        const folder = post.type === 'gallery' ? 'gallery' : 'bulletins';
        const storagePath = `public/${folder}/${post.filename}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, file, { contentType: file.type || 'image/webp' });
        const imageUrl = await getDownloadURL(storageRef);
        await setDoc(doc(db, 'posts', post.id), {
          type: post.type, title: post.title, description: post.description, date: post.date,
          imageUrl, storagePath, published: true, createdBy: user.uid, createdAt: serverTimestamp(),
        }, { merge: true });
      }
      await setDoc(doc(db, 'siteSettings', 'content'), { managed: true, updatedAt: serverTimestamp() }, { merge: true });
      setUploadStatus('사진 3장과 주보를 Firebase Storage·Firestore에 등록했습니다.');
    } catch (error) {
      setUploadStatus('');
      setUploadError(`Firebase 업로드에 실패했습니다. ${error.code === 'storage/unauthorized' || error.code === 'permission-denied' ? '관리자 UID와 Firestore·Storage 보안 규칙을 확인해 주세요.' : error.message}`);
    } finally { setSeedBusy(false); }
  };

  const handleNewPost = async (event) => {
    event.preventDefault();
    if (!isAdmin || (!editingPost && !newFile)) return;
    const form = event.currentTarget;
    setUploadError(''); setUploadStatus('파일을 Firebase에 올리는 중입니다.');
    try {
      if (newFile && !['image/jpeg', 'image/png', 'image/webp'].includes(newFile.type)) throw new Error('JPG, PNG 또는 WebP 이미지만 올릴 수 있습니다.');
      if (newFile && newFile.size > 8 * 1024 * 1024) throw new Error('이미지 크기는 8MB 이하여야 합니다.');
      const id = editingPost?.id || crypto.randomUUID();
      let imageUrl = editingPost?.imageUrl;
      let storagePath = editingPost?.storagePath;
      if (newFile) {
        const folder = newType === 'gallery' ? 'gallery' : 'bulletins';
        storagePath = `public/${folder}/${id}-${newFile.name.replace(/[^\w.-]/g, '_')}`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, newFile, { contentType: newFile.type });
        imageUrl = await getDownloadURL(storageRef);
        if (editingPost?.storagePath && editingPost.storagePath !== storagePath) {
          try { await deleteObject(ref(storage, editingPost.storagePath)); } catch { /* Replacing content should still complete if the old file is already missing. */ }
        }
      }
      const data = {
        type: newType, title: newTitle.trim(), description: newDescription.trim(), date: newDate,
        imageUrl, storagePath, published: true, createdBy: editingPost?.createdBy || user.uid,
        createdAt: editingPost?.createdAt || serverTimestamp(),
      };
      if (editingPost) await updateDoc(doc(db, 'posts', id), data);
      else await setDoc(doc(db, 'posts', id), data);
      setUploadStatus(editingPost ? '게시물을 수정했습니다.' : '게시물을 등록했습니다.');
      setNewTitle(''); setNewDescription(''); setNewFile(null); setEditingPost(null);
      form.reset();
    } catch (error) {
      setUploadStatus(''); setUploadError(error.code === 'storage/unauthorized' || error.code === 'permission-denied'
        ? 'Firebase 권한이 없습니다. 관리자 UID와 보안 규칙을 확인해 주세요.' : error.message || '게시물을 등록하지 못했습니다.');
    }
  };

  const startEditing = (post) => {
    setEditingPost(post); setNewType(post.type); setNewTitle(post.title || '');
    setNewDate(post.date || new Date().toLocaleDateString('sv-SE'));
    setNewDescription(post.description || ''); setNewFile(null); setUploadError(''); setUploadStatus('');
  };

  const cancelEditing = () => {
    setEditingPost(null); setNewType('gallery'); setNewTitle(''); setNewDate(new Date().toLocaleDateString('sv-SE'));
    setNewDescription(''); setNewFile(null); setUploadError(''); setUploadStatus('');
  };

  const removePost = async (post) => {
    if (!isAdmin || !window.confirm(`“${post.title}” 게시물을 삭제할까요?`)) return;
    setUploadStatus('게시물을 삭제하는 중입니다.'); setUploadError('');
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      if (post.storagePath) { try { await deleteObject(ref(storage, post.storagePath)); } catch { /* The record is removed even if its Storage object was already deleted. */ } }
      setUploadStatus('게시물을 삭제했습니다.');
    } catch (error) {
      setUploadStatus(''); setUploadError(error.code === 'permission-denied' ? '관리자 권한 또는 Firestore 보안 규칙을 확인해 주세요.' : '게시물을 삭제하지 못했습니다.');
    }
  };

  const doSignOut = async () => { await signOut(auth); setAuthMessage('로그아웃했습니다.'); setIsAdmin(false); };
  const copyUid = async () => { if (user?.uid) await navigator.clipboard?.writeText(user.uid); setAuthMessage('UID를 복사했습니다.'); };

  return <>
    <div className="topline"><span>대한예수교장로회 통합</span><span className="topline-right">서울 성북구 성북동 · 반가운교회</span></div>
    <header className="header">
      <button className="brand brand-button" onClick={()=>navigatePage('intro')} aria-label="반가운교회 홈"><img className="brand-img" src={churchLogo} alt="반가운교회 Bangawoon Church"/></button>
      <nav className="desktop-nav">{nav.map((item,index)=><button key={item.title} onMouseEnter={()=>setActive(item.title)} onClick={()=>navigatePage(pageIds[index])}>{item.title}<span className="nav-dot"/></button>)}</nav>
      <button className="auth-trigger" onClick={()=>{setAuthOpen(true);setAuthError('');setAuthMessage('');}}>{user?<ShieldCheck size={16}/>:<LogIn size={16}/>} {isAdmin?'관리자':user?'내 계정':'로그인 / 가입'}</button>
      <button className="visit-btn" onClick={()=>openSubmenu('오시는 길')}>처음 오셨나요? <ArrowUpRight size={15}/></button>
      <button className="mobile-menu" onClick={()=>setMenuOpen(!menuOpen)} aria-label="메뉴 열기">{menuOpen?<X/>:<Menu/>}</button>
      {active && <div className="mega" onMouseLeave={()=>setActive('')}><div><span className="eyebrow">{active}</span><h3>반가운 마음으로<br/>여러분을 기다립니다.</h3></div><div className="mega-links">{nav.find(n=>n.title===active)?.links.map(l=><button key={l} onClick={()=>openSubmenu(l)}>{l}<ChevronRight size={14}/></button>)}</div><div className="mega-note">하나님과 사귀며<br/>함께 자라가는 공동체</div></div>}
    </header>
    {menuOpen && <div className="mobile-drawer">{nav.map((n,index)=><div key={n.title}><button className="mobile-nav-title" onClick={()=>navigatePage(pageIds[index])}>{n.title}<ChevronRight size={16}/></button>{page===pageIds[index]&&n.links.map(l=><button className="mobile-nav-sub" key={l} onClick={()=>openSubmenu(l)}>{l}</button>)}</div>)}<button className="drawer-auth" onClick={()=>{setAuthOpen(true);setMenuOpen(false);}}>로그인 / 회원가입 <LogIn size={16}/></button><button className="drawer-visit" onClick={()=>openSubmenu('오시는 길')}>처음 오셨나요? <ArrowRight size={16}/></button></div>}

    <main id="home">
      {page==='intro'&&<section className="hero">
        <div className="hero-image"><div className="sunwash"/><div className="hero-arch"><div className="arch-inner"><div className="arch-cross"><span/></div><div className="arch-copy"><span>WORSHIP · COMMUNITY · NEXT GENERATION</span><b>함께 예배하고<br/>함께 자라는</b><em>반가운 공동체</em></div></div></div></div>
        <div className="hero-content"><span className="eyebrow"><i/> 하나님과 사귀며, 함께 자라는 교회</span><h1>당신의 오늘에<br/><span>반가운 은혜</span>가 있기를</h1><p>있는 모습 그대로 환대하고, 말씀과 기도 안에서<br className="desktop-only"/> 하나님과 함께 자라가는 공동체입니다.</p><div className="hero-actions"><button className="primary-btn" onClick={()=>openSubmenu('오시는 길')}>교회에 처음 오시나요? <ArrowRight size={17}/></button><button className="text-btn" onClick={()=>jump('about')}>반가운교회 알아보기 <ArrowDown size={15}/></button></div></div>
        <div className="hero-index"><b>01</b><span/>03</div><div className="hero-side">A PLACE TO GROW TOGETHER</div>
      </section>}

      {page==='worship'&&<><section className="quickbar" id="worship"><div className="quick-intro"><span className="eyebrow">JOIN US THIS WEEK</span><strong>함께 예배해요</strong></div><div className="service"><span className="service-icon"><Cross size={17}/></span><div><small>주일예배</small><b>주일 오전 11:00</b></div></div><div className="service"><span className="service-icon green"><Clock3 size={17}/></span><div><small>새벽예배 · 화–금</small><b>오전 5:30</b></div></div><div className="service"><span className="service-icon sand"><Heart size={17}/></span><div><small>금요기도회</small><b>금요일 저녁 8:30</b></div></div></section><section className="page-content section-pad"><div className="section-heading"><div><span className="eyebrow">WORSHIP & WORD</span><h2>예배와 말씀 안에서 자라갑니다</h2></div><p>함께 드리는 예배와 말씀, 기도로<br/>한 주를 살아갈 힘을 얻습니다.</p></div><div className="belief-grid"><article className="belief-card" id="word"><div className="belief-top"><span>말씀</span><BookOpen size={19}/></div><h3>말씀 나눔</h3><p>성경 말씀을 함께 읽고 삶의 자리에서 실천할 은혜를 나눕니다.</p></article><article className="belief-card" id="prayer"><div className="belief-top"><span>기도</span><Heart size={19}/></div><h3>기도 모임</h3><p>서로의 삶과 교회를 위해 함께 기도하며 하나님을 바라봅니다.</p></article></div></section></>}

      {page==='intro'&&<section className="intro section-pad" id="about"><div className="intro-left"><span className="eyebrow"><i className="blue-dot"/> WELCOME TO BANGAWOON</span><h2>반가운 마음으로<br/>함께 걸어가요<span className="period">.</span></h2><p>반가운교회는 하나님과의 인격적인 사귐을 통해 사람이 변화되고, 변화된 사람들이 공동체와 세상 속에서 하나님 나라를 살아내도록 세워가는 교회입니다.</p><button className="under-link" onClick={()=>jump('beliefs')}>우리 교회 더 알아보기 <ArrowRight size={16}/></button></div><div className="intro-right"><div className="intro-art"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><span className="art-cross"><Cross size={43}/></span><div className="art-caption"><span>GROW IN</span><b>Grace<br/>&amp; Truth</b></div><span className="art-stamp">성북동에서<br/>함께 자라다</span></div><div className="intro-quote"><span>“</span><p>하나님과의 사귐이<br/>우리의 삶을 바꿉니다.</p></div></div></section>}

      {page==='intro'&&<section className="belief-section section-pad" id="beliefs"><div className="section-heading"><div><span className="eyebrow">OUR VISION & VALUES</span><h2>우리가 함께 바라보는 것</h2></div><p>말씀과 기도, 예배와 소그룹 안에서<br/>하나님 나라를 함께 살아갑니다.</p></div><div className="belief-grid">{beliefs.map(([n,title,desc,icon])=><article className="belief-card" key={n}><div className="belief-top"><span>{n}</span><Icon name={icon} size={19}/></div><h3>{title}</h3><p>{desc}</p><span className="belief-line"/></article>)}</div><div className="vision-note"><span className="vision-mark">“</span><p>한 사람의 변화가 가정과 학교, 일터와 세상으로 흘러가도록<br className="desktop-only"/> 우리는 함께 하나님 나라를 꿈꿉니다.</p><span className="vision-tag">SPIRITUALITY · COMMUNITY · NEXT GENERATION</span></div></section>}

      {(page==='intro'||page==='community')&&<section className="story-section" id={page==='intro'?'story':'people'}><div className="story-photo"><div className="photo-overlay"/><div className="photo-label"><span>OUR STORY</span><b>작은 시작,<br/>함께 세운 예배의 자리</b></div><div className="photo-note">2026. 10. 04<br/>새 성전 첫 예배</div></div><div className="story-copy"><span className="eyebrow">A CHURCH PLANTED IN FEBRUARY</span><h2>반가운교회,<br/>이야기가 시작됐어요</h2><p>목사님 가정에서 시작된 작은 예배가 성도들의 기도와 사랑으로 이어졌습니다. 연습실에서 함께 예배하고 나누던 시간들을 지나, 2026년 10월 새로운 성전에서 예배를 드리게 되었습니다.</p><div className="timeline"><div><b>02</b><span>가정에서 시작한 첫 예배</span></div><div><b>04</b><span>연습실에서 함께 드린 예배</span></div><div className="current"><b>10</b><span>새 성전 입당, 새로운 걸음</span></div></div>{page==='intro'&&<button className="under-link" onClick={()=>openSubmenu('교회사진 게시판')}>우리 공동체 만나기 <ArrowRight size={16}/></button>}</div></section>}
      {page==='community'&&<section className="page-content section-pad"><div className="section-heading"><div><span className="eyebrow">LIFE TOGETHER</span><h2>함께하는 공동체</h2></div><p>세대와 삶의 자리를 넘어<br/>서로를 환대하며 함께 자랍니다.</p></div><div className="belief-grid"><article className="belief-card" id="nextgen"><div className="belief-top"><span>01</span><UsersRound size={19}/></div><h3>다음세대</h3><p>아이들과 청소년이 믿음 안에서 사랑받고 자라도록 함께 돌봅니다.</p></article><article className="belief-card" id="smallgroup"><div className="belief-top"><span>02</span><Heart size={19}/></div><h3>소그룹</h3><p>일상의 이야기를 나누고 말씀과 기도로 서로를 세워갑니다.</p></article></div></section>}

      {page==='news'&&<section className="gallery-section section-pad" id="gallery"><div className="section-heading"><div><span className="eyebrow">CHURCH PHOTO BOARD</span><h2>반가운교회 사진 이야기</h2></div><p>작은 예배에서 새 성전까지,<br/>함께 걸어온 시간을 담았습니다.</p></div>{cloudError&&<div className="cloud-warning">현재 홈페이지에 포함된 사진을 보여드리고 있습니다. Firebase 게시물을 불러오지 못했지만 기본 사진은 계속 볼 수 있습니다.</div>}<div className="gallery-grid">{galleryPosts.map((post,index)=><article className={`gallery-card gallery-card-${index+1}`} key={post.id}><button className="gallery-image" onClick={()=>setViewer(post)} aria-label={`${post.title} 사진 크게 보기`}><img src={post.imageUrl} alt={post.title} loading="lazy"/><span className="image-expand"><ArrowUpRight size={18}/></span></button><div className="gallery-caption"><div><span>{post.date?.replaceAll('-', '. ')}</span><h3>{post.title}</h3><p>{post.description}</p></div><span className="gallery-number">0{index+1}</span></div></article>)}</div></section>}

      {page==='news'&&<section className="bulletin-section section-pad" id="bulletin"><div className="bulletin-copy"><span className="eyebrow">WEEKLY BULLETIN</span><h2>이번 주 예배와<br/>교회 소식</h2><p>주일 예배 순서와 교회 소식, 한 주간 묵상 본문을 확인해 보세요.</p><div className="bulletin-meta"><span>반가운교회 주보</span><b>2026년 10월 11일 · 제34호</b></div><button className="primary-btn" onClick={()=>setViewer(bulletinPosts[0])}>주보 크게 보기 <ArrowUpRight size={16}/></button><a className="bulletin-download" href={bulletinPosts[0]?.imageUrl} target="_blank" rel="noreferrer">원본 이미지 새 창에서 보기 <ExternalLink size={14}/></a></div><button className="bulletin-sheet" onClick={()=>setViewer(bulletinPosts[0])} aria-label="2026년 10월 11일 주보 크게 보기"><img src={bulletinPosts[0]?.imageUrl} alt="반가운교회 2026년 10월 11일 주보" loading="lazy"/></button></section>}

      {page==='intro'&&<section className="welcome section-pad" id="visit"><div className="welcome-copy"><span className="eyebrow"><i className="green-dot"/> YOUR FIRST VISIT</span><h2>처음이어도<br/>괜찮아요<span className="period">.</span></h2><p>낯설고 어색한 마음까지 반갑게 맞이할게요.<br/>예배 시간에 맞춰 편하게 찾아와 주세요.</p><div className="welcome-meta"><div><span className="meta-icon"><MapPin size={18}/></span><div><small>오시는 곳</small><b>{address}</b></div></div><div><span className="meta-icon"><Clock3 size={18}/></span><div><small>주일예배</small><b>매주 주일 오전 11:00</b></div></div></div><a className="map-btn" href="https://naver.me/xZKH48EF" target="_blank" rel="noreferrer">네이버 지도로 길찾기 <ArrowUpRight size={16}/></a></div><div className="map-card"><div className="map-bg"><div className="street street-a"/><div className="street street-b"/><div className="street street-c"/><div className="park"><span>성북동</span></div><div className="map-block block-a"/><div className="map-block block-b"/><div className="map-block block-c"/><div className="map-block block-d"/><div className="map-pin"><MapPin size={23} fill="currentColor"/><span>반가운교회</span></div><span className="map-label label-a">성북로</span><span className="map-label label-b">한신한진아파트</span><span className="map-label label-c">성북천</span></div><a className="map-foot" href="https://naver.me/xZKH48EF" target="_blank" rel="noreferrer"><span><b>반가운교회</b><small>서울 성북구 성북로4길 52 · 3층 3302호</small></span><ArrowUpRight size={18}/></a></div></section>}

      {page==='news'&&<section className="connect"><div><span className="eyebrow">STAY CONNECTED</span><h2>반가운 소식을 만나보세요</h2><p>예배와 공동체의 이야기를 나눕니다.</p></div><div className="social-links"><a href="https://www.instagram.com/bangawoonchurch/" target="_blank" rel="noreferrer"><Instagram size={19}/><span>Instagram</span><ArrowUpRight size={15}/></a><a href="https://www.youtube.com/@%EB%B0%98%EA%B0%80%EC%9A%B4%EA%B5%90%ED%9A%8C" target="_blank" rel="noreferrer"><Youtube size={20}/><span>YouTube</span><ArrowUpRight size={15}/></a></div></section>}
    </main>

    <footer><div className="footer-main"><a className="brand footer-brand" href="#home"><img className="brand-img" src={churchLogo} alt="반가운교회 Bangawoon Church"/></a><p>하나님과의 사귐 안에서<br/>함께 자라가는 공동체</p><div className="footer-details"><span>{address}</span><span>담임목사 안경혁 · 대한예수교장로회 통합</span></div><a className="footer-map" href="https://naver.me/xZKH48EF" target="_blank" rel="noreferrer">오시는 길 <ArrowUpRight size={14}/></a></div><div className="footer-bottom"><span>© 2026 반가운교회. All rights reserved.</span><span>성북동에 반가운 교회, 반가운 사람들</span></div></footer>

      {authOpen && <div className="dialog-backdrop" onClick={()=>setAuthOpen(false)}><section className="auth-dialog" onClick={(event)=>event.stopPropagation()} aria-modal="true" role="dialog" aria-labelledby="auth-title"><button className="dialog-close" onClick={()=>setAuthOpen(false)} aria-label="닫기"><X size={20}/></button>{user?<>
      <span className="eyebrow">YOUR ACCOUNT</span><h2 id="auth-title">{isAdmin?'관리자 계정':'가입된 계정'}</h2><p className="account-email">{user.displayName || user.email}</p><div className={`role-banner ${isAdmin?'admin':'pending'}`}>{adminChecking?'관리자 권한을 확인하는 중입니다.':isAdmin?'관리자 권한이 확인됐습니다. 사진·주보 게시물을 등록할 수 있습니다.':'회원가입이 완료됐습니다. 게시 권한은 관리자가 승인한 계정에만 부여됩니다.'}</div>
      <div className="uid-row"><span><small>계정 UID</small><code>{user.uid}</code></span><button onClick={copyUid} aria-label="UID 복사"><Copy size={16}/></button></div>
      {!isAdmin&&!adminChecking&&<><p className="admin-setup-note">관리자 권한은 직접 가입할 수 없습니다. 교회 관리자가 Firebase Console의 Firestore에서 <code>admins</code> 컬렉션을 열고, 문서 ID를 위 UID와 똑같이 추가하면 게시 권한이 생깁니다.</p><button className="refresh-role" onClick={refreshAdmin}>관리자 권한 다시 확인</button></>}
      {isAdmin&&<div className="admin-tools"><div className="admin-tools-heading"><ShieldCheck size={20}/><div><b>교회 콘텐츠 관리</b><span>등록한 자료는 Firebase에 저장됩니다.</span></div></div><button className="seed-button" onClick={publishInitialContent} disabled={seedBusy}><Upload size={17}/>{seedBusy?'초기 자료 올리는 중…':'초기 사진 3장과 주보를 Firebase에 등록'}</button><div className="managed-posts"><h3>게시된 자료</h3>{remotePosts.length===0?<p>Firebase에 등록된 게시물이 없습니다.</p>:remotePosts.map((post)=><div className="managed-post" key={post.id}><span><b>{post.type==='gallery'?'사진':'주보'} · {post.title}</b><small>{post.date}</small></span><button onClick={()=>startEditing(post)} aria-label={`${post.title} 수정`}>수정</button><button className="delete-post" onClick={()=>removePost(post)} aria-label={`${post.title} 삭제`}>삭제</button></div>)}</div><form className="post-form" onSubmit={handleNewPost}><h3>{editingPost?'게시물 수정':'새 게시물 올리기'}</h3><label>게시판<select value={newType} onChange={(event)=>setNewType(event.target.value)}><option value="gallery">교회사진 게시판</option><option value="bulletin">주보 게시판</option></select></label><label>제목<input required maxLength={100} value={newTitle} onChange={(event)=>setNewTitle(event.target.value)} placeholder="게시물 제목"/></label><label>날짜<input required type="date" value={newDate} onChange={(event)=>setNewDate(event.target.value)}/></label><label>설명<textarea maxLength={500} value={newDescription} onChange={(event)=>setNewDescription(event.target.value)} placeholder="사진이나 주보에 대한 설명" rows="3"/></label><label className="file-picker"><ImagePlus size={18}/><span>{newFile?.name || (editingPost?'새 이미지 선택 (선택 사항)':'이미지 선택 (JPG·PNG·WebP, 8MB 이하)')}</span><input required={!editingPost} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>setNewFile(event.target.files?.[0] || null)}/></label><button className="primary-btn" type="submit"><Upload size={16}/>{editingPost?'수정 내용 저장':'Firebase에 게시'}</button>{editingPost&&<button className="cancel-edit" type="button" onClick={cancelEditing}>수정 취소</button>}</form></div>}
      {authMessage&&<p className="form-message success">{authMessage}</p>}{uploadStatus&&<p className="form-message success">{uploadStatus}</p>}{uploadError&&<p className="form-message error">{uploadError}</p>}
      <button className="signout-btn" onClick={doSignOut}><LogOut size={16}/> 로그아웃</button>
    </>:<><span className="eyebrow">WELCOME TO BANGAWOON</span><h2 id="auth-title">{authMode==='signin'?'로그인':'회원가입'}</h2><p className="auth-intro">반가운교회 소식과 게시물을 관리합니다.</p><form className="auth-form" onSubmit={handleAuth}>{authMode==='signup'&&<label>이름<input value={displayName} onChange={(event)=>setDisplayName(event.target.value)} placeholder="이름" autoComplete="name"/></label>}<label>이메일<input required type="email" value={authEmail} onChange={(event)=>setAuthEmail(event.target.value)} placeholder="이메일 주소" autoComplete="email"/></label><label>비밀번호<input required type="password" minLength="6" value={authPassword} onChange={(event)=>setAuthPassword(event.target.value)} placeholder="6자 이상" autoComplete={authMode==='signup'?'new-password':'current-password'}/></label><button className="primary-btn auth-submit" type="submit" disabled={authBusy}>{authBusy?'처리 중…':authMode==='signin'?'로그인':'회원가입'} <ArrowRight size={16}/></button></form><p className="auth-switch">{authMode==='signin'?'계정이 없으신가요?':'이미 가입하셨나요?'} <button onClick={()=>{setAuthMode(authMode==='signin'?'signup':'signin');setAuthError('');setAuthMessage('');}}>{authMode==='signin'?'회원가입':'로그인'}</button></p><p className="signup-note">회원가입만으로 관리자 권한이 생기지 않습니다. 교회 관리자가 승인한 계정만 게시할 수 있습니다.</p>{authMessage&&<p className="form-message success">{authMessage}</p>}{authError&&<p className="form-message error">{authError}</p>}</>}
    </section></div>}

    {viewer&&<div className="viewer-backdrop" onClick={()=>setViewer(null)}><section className="image-viewer" onClick={(event)=>event.stopPropagation()} aria-modal="true" role="dialog" aria-label={viewer.title}><div className="viewer-heading"><span><b>{viewer.title}</b><small>{viewer.description}</small></span><button onClick={()=>setViewer(null)} aria-label="닫기"><X size={20}/></button></div><img src={viewer.imageUrl} alt={viewer.title}/></section></div>}
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);

