#version 460

layout (location = 0) uniform ivec2 iResolution;
layout (location = 1) uniform float iTime;

in vec3 vp;

void main()
{
    gl_Position = vec4(vp, 1.0);

    // gl_Position.x = gl_Position.x*0.5;
};