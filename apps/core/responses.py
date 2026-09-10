from rest_framework.response import Response
from rest_framework import status


def success_response(data=None, message="Success", status_code=status.HTTP_200_OK):
    return Response({"success": True, "data": data, "message": message}, status=status_code)


def created_response(data=None, message="Created successfully"):
    return Response({"success": True, "data": data, "message": message},
                    status=status.HTTP_201_CREATED)


def error_response(code, message, status_code=status.HTTP_400_BAD_REQUEST, details=None):
    body = {"success": False, "error": {"code": code, "message": message}}
    if details:
        body["error"]["details"] = details
    return Response(body, status=status_code)


def no_content_response():
    return Response(status=status.HTTP_204_NO_CONTENT)
