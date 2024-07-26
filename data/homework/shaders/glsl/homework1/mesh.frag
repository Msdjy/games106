#version 450

layout (set = 1, binding = 0) uniform sampler2D samplerColorMap;
layout (set = 1, binding = 1) uniform sampler2D samplerMetallicRoughnessMap;
layout (set = 1, binding = 2) uniform sampler2D samplerNormalMap;
layout (set = 1, binding = 3) uniform sampler2D samplerEmissiveMap;
layout (set = 1, binding = 4) uniform sampler2D samplerAcclusionMap;

layout (location = 0) in vec3 inNormal;
layout (location = 1) in vec3 inColor;
layout (location = 2) in vec2 inUV;
layout (location = 3) in vec3 inViewVec;
layout (location = 4) in vec3 inLightVec;
layout (location = 5) in vec4 inTangent;

layout (location = 0) out vec4 outFragColor;

#define PI 3.1415926535897932384626433832795
// #define ALBEDO pow(texture(samplerColorMap, inUV).rgb, vec3(1.0 / 2.2))


vec3 calculateNormal()
{
	vec3 tangentNormal = texture(samplerNormalMap, inUV).xyz * 2.0 - 1.0;

	vec3 N = normalize(inNormal);
	vec3 T = normalize(inTangent.xyz);
	vec3 B = normalize(cross(N, T));
	mat3 TBN = mat3(T, B, N);
	return normalize(TBN * tangentNormal);
}

float D_GGX(float dotNH, float roughness)
{
	float alpha = roughness * roughness;
	float alpha2 = alpha * alpha;
	float nom = alpha2;
	float denom = dotNH * dotNH * (alpha2 - 1.0) + 1.0;
	return nom / (PI * denom * denom);
}

vec3 F_fresnel(float dotNV, vec3 F0) 
{
	return F0 + (1.0 - F0) * pow(1.0 - clamp(dotNV, 0.0, 1.0), 5.0);
}	

float G_Schlick(float dotNL, float dotNV, float roughness)
{	
	float alpha = roughness + 1.0;
	float k = alpha * alpha / 8.0;

	float GNL = dotNL / (dotNL * (1.0 - k) + k);
	float GNV = dotNV / (dotNV * (1.0 - k) + k);
	return GNL * GNV;
}

vec3 specularContribution(vec3 L, vec3 V, vec3 N, vec3 F0, float metallic, float roughness)
{
	vec3 H = normalize(L + V);
	float dotNH = clamp(dot(N, H), 0.0, 1.0);
	float dotNV = clamp(dot(N, V), 0.0, 1.0);
	float dotNL = clamp(dot(N, L), 0.0, 1.0);

	float D = D_GGX(dotNH, roughness);
	vec3 F = F_fresnel(dotNV, F0);
	float G = G_Schlick(dotNL, dotNV, roughness);

	vec3 spec = D * F * G / (4.0 * dotNL * dotNV);

	vec3 ks = F;
	vec3 kd = vec3(1.0) - ks;
	kd *= (1.0 - metallic); 

	vec3 albedo = texture(samplerColorMap, inUV).rgb;

	vec3 brdf = (kd * albedo / PI + spec);
	vec3 color = brdf * dotNL;

	// Gamma correction
	
	return color;
	// return vec3(dotNV);
}

void main() 
{
	vec4 color = texture(samplerColorMap, inUV) * vec4(inColor, 1.0);

	vec3 N = calculateNormal();
	vec3 L = normalize(inLightVec);
	vec3 V = normalize(inViewVec);
	vec3 R = reflect(L, N);

	float metallic = texture(samplerMetallicRoughnessMap, inUV).b;
	float roughness = texture(samplerMetallicRoughnessMap, inUV).g;
	float ao = texture(samplerMetallicRoughnessMap, inUV).r;
	vec3 emissive = texture(samplerEmissiveMap, inUV).rgb;

	vec3 F0 = vec3(0.04);
	F0 = mix(F0, color.rgb, metallic);

	vec3 Lo = vec3(0.0);
	Lo = specularContribution(L, V, N, F0, metallic, roughness);

	
	


	// vec3 diffuse = max(dot(N, L), 0.15) * inColor;
	// vec3 specular = pow(max(dot(R, V), 0.0), 16.0) * vec3(0.75);
	
	Lo = pow(Lo, vec3(1.0 / 2.2));
	outFragColor = vec4(Lo, 1.0);		
}