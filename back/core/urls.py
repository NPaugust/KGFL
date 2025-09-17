from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SeasonViewSet, PartnerViewSet, MediaViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'seasons', SeasonViewSet)
router.register(r'partners', PartnerViewSet)
router.register(r'media', MediaViewSet)


urlpatterns = [
    path('', include(router.urls)),
] 