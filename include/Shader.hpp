#ifndef SHADER_HPP
#define SHADER_HPP

#include <GL/glew.h>
#define GLFW_DLL
#include <GLFW/glfw3.h>

GLuint LoadShader(const char *vertex_path, const char *fragment_path);

class Shader
{
    private :
        GLuint type;
        GLuint shader;
        std::string Path;

    public :
        Shader();
        Shader(std::string Path);

        // Load the shader from the file at the given path
        // .vert for vertex shaders
        // .geom for geometry shaders
        // .frag for fragment shaders
        int load_from_file(std::string Path);
};


#endif