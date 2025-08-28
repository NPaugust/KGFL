from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SeasonViewSet, PartnerViewSet, MediaViewSet, RefereeViewSet, ManagementViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'seasons', SeasonViewSet)
router.register(r'partners', PartnerViewSet)
router.register(r'media', MediaViewSet)
router.register(r'referees', RefereeViewSet)
router.register(r'management', ManagementViewSet)


urlpatterns = [
    path('', include(router.urls)),
] 