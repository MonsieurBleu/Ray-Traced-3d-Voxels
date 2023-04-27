#ifndef GLUTILS_HPP
#define GLUTILS_HPP

#include <iostream>

#include <Utils.hpp>

#include <GL/glew.h>
#define GLFW_DLL
#include <GLFW/glfw3.h>

/// OPEN GL
void GLAPIENTRY MessageCallback(GLenum source,
                                GLenum type,
                                GLuint id,
                                GLenum severity,
                                GLsizei length,
                                const GLchar* message,
                                const void* userParam )
{
    if(type == GL_DEBUG_TYPE_ERROR)
    {
        std::cerr
        << TERMINAL_ERROR
        << "GL CALLBACK : " 
        << " GL ERROR "
        << " type = " << type
        << " severity = " << severity
        << " message = " << message
        << "\n" << TERMINAL_RESET;

    }
};


#endif