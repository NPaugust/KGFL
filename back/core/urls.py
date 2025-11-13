from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, SeasonViewSet, GroupViewSet, PartnerViewSet, MediaViewSet, HealthCheckViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'seasons', SeasonViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'partners', PartnerViewSet)
router.register(r'media', MediaViewSet)
router.register(r'health', HealthCheckViewSet, basename='health')


urlpatterns = [
    path('', include(router.urls)),
] 