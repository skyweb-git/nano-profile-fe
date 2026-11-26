import './App.css';
import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import ShowcaseSkeleton from './components/ShowcaseSkeleton';
// import ResumePage from './pages/ResumePage';

const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const GeneralProfileView = lazy(() => import('./pages/GeneralProfileView'));
const ArtistPublicView = lazy(() => import('./pages/ArtistPublicView'));
const Home = lazy(() => import('./pages/Home'));
const ArtistShowcase = lazy(() => import('./pages/ArtistShowcase'));
const FounderShowcase = lazy(() => import('./pages/FounderShowcase'));
const CompanyShowcase = lazy(() => import('./pages/CompanyShowcase'));
const RestaurantShowcase = lazy(() => import('./pages/RestaurantShowcase'));
const ProfessionalShowcase = lazy(() => import('./pages/ProfessionalShowcase'));
const Profiles = lazy(() => import('./pages/Profiles'));
const ArtGalleryPage = lazy(() => import('./pages/ArtGalleryPage'));
const MasterArtRedirect = lazy(() => import('./pages/MasterArtRedirect'));
const NfcPaymentView = lazy(() => import('./pages/NfcPaymentView'));
const InstagramArtworkCropShowcase = lazy(() => import('./pages/InstagramArtworkCropShowcase'));

function App() {

  return (
    <div>
      <ScrollToTop />
      <Suspense fallback={<ShowcaseSkeleton type="home" />}>
        <Routes>
          <Route path="/profile" element={
            <Suspense fallback={null}>
              <Profile />
            </Suspense>
          } />
          <Route path="/login" element={
            <Suspense fallback={<ShowcaseSkeleton type="login" />}>
              <Login />
            </Suspense>
          } />
          <Route path="/signup" element={
            <Suspense fallback={<ShowcaseSkeleton type="login" />}>
              <Login />
            </Suspense>
          } />
          <Route path="/link/:username" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-general" />}>
              <GeneralProfileView />
            </Suspense>
          } />
          <Route path="/founder/:username" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-general" />}>
              <GeneralProfileView />
            </Suspense>
          } />
          <Route path="/company/:username" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-general" />}>
              <GeneralProfileView />
            </Suspense>
          } />
          <Route path="/restaurant/:username" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-general" />}>
              <GeneralProfileView />
            </Suspense>
          } />
          <Route path="/artist/:artistId" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-artist" />}>
              <ArtistPublicView />
            </Suspense>
          } />
          <Route path="/a/:artistId/art" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-artist" />}>
              <MasterArtRedirect />
            </Suspense>
          } />
          <Route path="/show-my-art" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-artist" />}>
              <ArtGalleryPage />
            </Suspense>
          } />
          <Route path="/pay/:tagCode" element={
            <Suspense fallback={<ShowcaseSkeleton type="public-artist" />}>
              <NfcPaymentView />
            </Suspense>
          } />
          <Route path="/artist-showcase" element={
            <Suspense fallback={<ShowcaseSkeleton type="artist" />}>
              <ArtistShowcase />
            </Suspense>
          } />
          <Route path="/founder-showcase" element={
            <Suspense fallback={<ShowcaseSkeleton type="professional" />}>
              <FounderShowcase />
            </Suspense>
          } />
          <Route path="/company-showcase" element={
            <Suspense fallback={<ShowcaseSkeleton type="professional" />}>
              <CompanyShowcase />
            </Suspense>
          } />
          {/* Student profiles are admin-only; keep old public URLs redirected to founder. */}
          <Route path="/student" element={<Navigate to="/founder-showcase" replace />} />
          <Route path="/student-showcase" element={<Navigate to="/founder-showcase" replace />} />
          <Route path="/restaurant-showcase" element={
            <Suspense fallback={<ShowcaseSkeleton type="restaurant" />}>
              <RestaurantShowcase />
            </Suspense>
          } />
          <Route path="/professional-showcase" element={
            <Suspense fallback={<ShowcaseSkeleton type="professional" />}>
              <ProfessionalShowcase />
            </Suspense>
          } />
          <Route path="/profiles" element={
            <Suspense fallback={<ShowcaseSkeleton type="home" />}>
              <Profiles />
            </Suspense>
          } />
          <Route path="/artwork-crop" element={
            <Suspense fallback={<ShowcaseSkeleton type="home" />}>
              <InstagramArtworkCropShowcase />
            </Suspense>
          } />
          <Route path="/crop-artwork" element={
            <Suspense fallback={<ShowcaseSkeleton type="home" />}>
              <InstagramArtworkCropShowcase />
            </Suspense>
          } />
{/* <Route path="/resume" element={<ResumePage />} /> */}

          <Route path="/*" element={
            <Suspense fallback={<ShowcaseSkeleton type="home" />}>
              <Home />
            </Suspense>
          } />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;

